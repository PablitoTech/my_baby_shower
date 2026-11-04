-- Se retira la recuperación de contraseña por correo (no hay proveedor de correo
-- configurado). La funcionalidad queda en el historial de git para restaurarla.
DROP TABLE IF EXISTS "password_reset_tokens";
