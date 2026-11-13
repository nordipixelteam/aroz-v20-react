import { randomUUID } from 'node:crypto';
import { getMongoClient, getMongoDb } from '../db/connection.js';

const checks = {
  connected: false,
  authenticated: false,
  expectedUser: false,
  correctDatabase: false,
  ping: false,
  readPermission: false,
  writePermission: false,
  permissionsScopedToDatabase: false,
  insert: false,
  read: false,
  update: false,
  delete: false,
  cleanup: false,
};
const diagnostics = {
  authenticatedIdentityCount: 0,
  expectedUserMatched: null,
  privilegeMetadataAvailable: false,
  operation: 'connect',
  temporaryCollectionDropped: false,
  otherDatabaseReadAllowed: false,
};

let client;
let temporaryCollection;
let temporaryDocumentId;
let operationError;
let cleanupError;

function safeError(error) {
  const uri = process.env.MONGODB_URI || '';
  const secrets = [uri];

  try {
    const parsed = new URL(uri);
    secrets.push(parsed.username, parsed.password);
    secrets.push(decodeURIComponent(parsed.username), decodeURIComponent(parsed.password));
  } catch {}

  let message = String(error?.message || '');
  for (const secret of secrets) {
    if (secret) message = message.replaceAll(secret, '[REDACTED]');
  }
  message = message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[REDACTED_MONGODB_URI]');

  return {
    name: error?.name,
    code: Number.isInteger(error?.code) ? error.code : undefined,
    codeName: error?.codeName,
    message,
  };
}

try {
  diagnostics.operation = 'connect';
  const db = await getMongoDb();
  client = await getMongoClient();
  checks.connected = true;
  checks.correctDatabase = db.databaseName === 'avault';

  diagnostics.operation = 'authenticate';
  const status = await db.command({ connectionStatus: 1, showPrivileges: true });
  const authenticatedUsers = status.authInfo.authenticatedUsers;
  const privileges = status.authInfo.authenticatedUserPrivileges || [];
  diagnostics.authenticatedIdentityCount = authenticatedUsers.length;
  const expectedUser = process.env.MONGODB_EXPECTED_USER || '';
  diagnostics.expectedUserMatched = expectedUser
    ? authenticatedUsers.some(user => user.user === expectedUser)
    : null;
  checks.authenticated = authenticatedUsers.length > 0;
  checks.expectedUser = expectedUser ? diagnostics.expectedUserMatched : true;
  diagnostics.privilegeMetadataAvailable = privileges.length > 0;

  diagnostics.operation = 'ping';
  const ping = await db.command({ ping: 1 });
  checks.ping = ping.ok === 1;

  temporaryCollection = db.collection(`__avault_connection_check_${randomUUID().replaceAll('-', '')}`);

  diagnostics.operation = 'insert';
  const inserted = await temporaryCollection.insertOne({ probe: 'connection-check' });
  temporaryDocumentId = inserted.insertedId;
  checks.insert = inserted.acknowledged;

  diagnostics.operation = 'read';
  const found = await temporaryCollection.findOne({ _id: temporaryDocumentId });
  checks.read = found?.probe === 'connection-check';

  diagnostics.operation = 'update';
  const updated = await temporaryCollection.updateOne(
    { _id: temporaryDocumentId },
    { $set: { probe: 'updated' } },
  );
  checks.update = updated.modifiedCount === 1;

  diagnostics.operation = 'delete';
  const deleted = await temporaryCollection.deleteOne({ _id: temporaryDocumentId });
  checks.delete = deleted.deletedCount === 1;

  checks.readPermission = checks.read;
  checks.writePermission = checks.insert && checks.update && checks.delete;

  diagnostics.operation = 'verify-scope';
  try {
    await client.db(`__avault_scope_check_${randomUUID().replaceAll('-', '')}`)
      .collection('probe')
      .findOne({});
    diagnostics.otherDatabaseReadAllowed = true;
  } catch (error) {
    if (error.code === 13 || error.code === 8000) {
      diagnostics.otherDatabaseReadAllowed = false;
    } else {
      throw error;
    }
  }
  checks.permissionsScopedToDatabase = !diagnostics.otherDatabaseReadAllowed;
} catch (error) {
  operationError = { operation: diagnostics.operation, ...safeError(error) };
} finally {
  if (temporaryCollection) {
    try {
      diagnostics.operation = 'cleanup';
      diagnostics.temporaryCollectionDropped = await temporaryCollection.drop();
      checks.cleanup = diagnostics.temporaryCollectionDropped || !temporaryDocumentId;
    } catch (error) {
      cleanupError = safeError(error);
      if (temporaryDocumentId) {
        try {
          const result = await temporaryCollection.deleteOne({ _id: temporaryDocumentId });
          checks.cleanup = result.deletedCount === 1 || checks.delete;
        } catch (fallbackError) {
          cleanupError = safeError(fallbackError);
        }
      } else {
        checks.cleanup = true;
      }
    }
  } else {
    checks.cleanup = true;
  }

  if (client) await client.close().catch(() => {});
}

const passed = Object.values(checks).every(Boolean);
const result = { passed, checks, diagnostics };
if (operationError) result.error = operationError;
if (cleanupError) result.cleanupError = cleanupError;
console.log(JSON.stringify(result, null, 2));
if (!passed) process.exitCode = 1;