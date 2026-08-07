# Instrucciones para poner en marcha Solwave Calendario

## 1. Crear proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta (gratis)
2. Crea un proyecto nuevo — ponle el nombre que quieras
3. Una vez creado, ve a **Project Settings → API**
4. Copia:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public key** (empieza con `eyJ...`)

## 2. Crear las tablas

1. En tu proyecto Supabase, ve a **SQL Editor**
2. Pega todo el contenido del archivo `supabase-schema.sql` (está en la raíz del proyecto)
3. Haz clic en **Run**

## 3. Configurar las variables de entorno

Abre el archivo `.env.local` en la raíz del proyecto y reemplaza:

```
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aquí
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aquí
APP_PASSWORD=la_contraseña_que_quieras
```

## 4. Ejecutar la app en local

```bash
npm run dev
```

Abre http://localhost:3000 en el navegador.
Entra con la contraseña que pusiste en APP_PASSWORD.
Al entrar por primera vez, la app carga automáticamente las 65 canciones y el calendario completo.

## 5. Desplegar en Vercel (opcional)

1. Sube el proyecto a GitHub
2. Crea un proyecto en Vercel y conéctalo al repositorio
3. En **Settings → Environment Variables**, agrega las mismas tres variables que están en `.env.local`
4. Despliega

---

## Contraseña por defecto
Si no cambias APP_PASSWORD en `.env.local`, la contraseña es: **solwave2026**
