# Dev / Production Environment Split

Use one Keycloak realm for both environments, but keep frontend API target and backend database separate.

## Production

Production frontend runs on Vercel and should use Vercel environment variables:

```env
ATTENDANCE_SERVICE_URL=https://attendance.icheck.today
ATTENDANCE_PUBLIC_URL=https://attendance.icheck.today
KEYCLOAK_ISSUER_URI=https://iam.icheck.today/realms/icheck
KEYCLOAK_CLIENT_ID=icheck
KEYCLOAK_CLIENT_SECRET=<production-keycloak-client-secret>
OAUTH_STATE_SECRET=<production-random-secret>
```

Production backend should run with:

```env
SPRING_PROFILES_ACTIVE=prod
DB_PROD_URL=<production-db-jdbc-url>
DATASOURCE_PROD_USERNAME=<production-db-user>
DATASOURCE_PROD_PASSWORD=<production-db-password>
KEYCLOAK_ISSUER_URI=https://iam.icheck.today/realms/icheck
```

## Local Development

Local frontend should call local backend, but still authenticate with production IAM:

```env
ATTENDANCE_SERVICE_URL=http://localhost:8090
ATTENDANCE_PUBLIC_URL=http://localhost:8090
KEYCLOAK_ISSUER_URI=https://iam.icheck.today/realms/icheck
KEYCLOAK_CLIENT_ID=icheck
KEYCLOAK_CLIENT_SECRET=<same-keycloak-client-secret-or-dev-client-secret>
OAUTH_STATE_SECRET=<local-random-secret>
```

Local backend should run with the dev Spring profile and dev DB:

```env
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8090
DEV_DB_URL=jdbc:postgresql://localhost:5432/icheck_dev
DEV_DB_USERNAME=<dev-db-user>
DEV_DB_PASSWORD=<dev-db-password>
KEYCLOAK_ISSUER_URI=https://iam.icheck.today/realms/icheck
```

## Keycloak Redirect URIs

Because dev uses production IAM, the `icheck` Keycloak client must allow both callback URLs:

```txt
https://icheck.today/api/auth/callback/keycloak
http://localhost:3000/api/auth/callback/keycloak
```

If you create a separate dev frontend domain later, add that callback too.

## Rule

Do not point local `.env.local` at production API unless you are intentionally testing production. Local frontend + local backend + dev DB lets you add test data without waiting for CI/CD.
