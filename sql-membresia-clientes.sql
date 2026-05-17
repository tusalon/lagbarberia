-- Sistema de membresia / cliente fiel.
-- Ejecutar una vez en el SQL editor de Supabase.

alter table public.configuracion
add column if not exists membresia_activa boolean not null default false,
add column if not exists membresia_citas_requeridas integer not null default 5,
add column if not exists membresia_descuento_porcentaje numeric not null default 0;

alter table public.reservas
add column if not exists membresia_descuento_aplicado boolean not null default false,
add column if not exists membresia_citas_requeridas integer,
add column if not exists membresia_citas_completadas integer,
add column if not exists membresia_descuento_porcentaje numeric not null default 0,
add column if not exists precio_original numeric not null default 0,
add column if not exists descuento_monto numeric not null default 0,
add column if not exists precio_final numeric not null default 0;

create index if not exists idx_reservas_membresia_cliente
on public.reservas (negocio_id, cliente_whatsapp, fecha, hora_inicio);
