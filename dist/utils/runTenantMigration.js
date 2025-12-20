"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTenantMigration = runTenantMigration;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
async function runTenantMigration(dbName, user, password, host, port) {
    const encodedPassword = encodeURIComponent(password);
    const url = `postgresql://${user}:${encodedPassword}@${host}:${port}/${dbName}?schema=public&sslmode=no-verify`;
    console.log('[runTenantMigration] Setting up tenant database:', dbName);
    try {
        console.log('[runTenantMigration] Executing Prisma migrations...');
        const schemaPath = path.join(process.cwd(), 'prisma', 'tenant', 'schema.prisma');
        (0, child_process_1.execSync)(`npx prisma migrate deploy --schema=${schemaPath}`, {
            stdio: 'inherit',
            env: Object.assign(Object.assign({}, process.env), { DATABASE_URL: url }),
        });
        console.log('[runTenantMigration] Prisma migrations completed successfully for:', dbName);
    }
    catch (error) {
        console.error('[runTenantMigration] Migration failed:', error.message);
        throw new Error(`Prisma migration failed for ${dbName}: ${error.message}`);
    }
}
//# sourceMappingURL=runTenantMigration.js.map