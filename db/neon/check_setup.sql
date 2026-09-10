-- Read-only diagnosis. Run as neondb_owner in the intended project/branch/database.
-- Safe to share the result row: no password, connection URL, tokens or student data.
SELECT current_database() AS database_name,
       current_user AS query_role,
       to_regclass('moi_ngay.schema_version') AS schema_table,
       (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'moi_ngay_runtime') AS runtime_can_login,
       ARRAY(
         SELECT rolname FROM pg_roles
         WHERE rolname IN ('moi_ngay_runtime', 'moi_ngay_api', 'moi_ngay_worker')
         ORDER BY rolname
       ) AS app_roles,
       ARRAY(
         SELECT granted_role.rolname
         FROM pg_auth_members membership
         JOIN pg_roles member_role ON member_role.oid = membership.member
         JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
         WHERE member_role.rolname = 'moi_ngay_runtime'
         ORDER BY granted_role.rolname
       ) AS runtime_grants;
