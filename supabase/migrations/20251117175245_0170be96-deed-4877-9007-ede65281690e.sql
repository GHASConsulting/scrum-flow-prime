-- Alterar o tipo da coluna dt_registro para varchar(200)
ALTER TABLE public.ava_evento 
ALTER COLUMN dt_registro TYPE varchar(200) USING dt_registro::text;