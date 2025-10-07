Claro, aquí tienes un resumen en formato Markdown, listo para subir a GitHub como un archivo `INSTRUCCIONES_DESPLIEGUE.md`.

-----

# Configuración de Despliegue en AWS Amplify con Backend Externo

Este documento detalla los pasos para configurar una aplicación en AWS Amplify que necesita consumir un archivo de configuración (`settings.js`) generado por un backend externo (ej. CloudFormation) y almacenado en un bucket de S3.

La configuración incluye:

1.  Crear un rol de IAM para darle permisos a Amplify.
2.  Añadir una variable de entorno para el bucket de S3.
3.  Modificar el archivo `amplify.yml` para automatizar la descarga del archivo de configuración.

## Paso 1: Crear y Asignar el Rol de IAM ⚙️

Amplify necesita un rol de servicio para interactuar de forma segura con otros servicios de AWS como S3.

### Creación del Rol

1.  Ve a la consola de **AWS IAM**.
2.  Navega a **Roles** y haz clic en **Crear rol**.
3.  Selecciona **Servicio de AWS** como entidad de confianza.
4.  Busca y elige **Amplify** como caso de uso y selecciona **Amplify - Backend Deployment**.
5.  Haz clic en **Siguiente** hasta llegar a la pantalla final.
6.  Asigna un nombre descriptivo al rol, como `Amplify-WebApp-ServiceRole`.
7.  Finaliza haciendo clic en **Crear rol**.

### Vinculación del Rol a Amplify

1.  Ve a la consola de **AWS Amplify** y selecciona tu aplicación.
2.  En el menú lateral, ve a **App settings \> General**.
3.  Haz clic en **Edit**, busca el campo **Service role**, y selecciona el rol que acabas de crear.
4.  Guarda los cambios.

-----

## Paso 2: Añadir Permisos de S3 al Rol ✅

Ahora, dale permiso al nuevo rol para que pueda leer el archivo de configuración desde el bucket de S3.

1.  Regresa a la consola de **IAM \> Roles** y busca tu rol (`Amplify-WebApp-ServiceRole`).
2.  En la pestaña **Permissions**, haz clic en **Add permissions \> Create inline policy**.
3.  Selecciona la pestaña **JSON** y pega el siguiente código.

<!-- end list -->

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::<NOMBRE_DE_TU_BUCKET_S3>/*"
        }
    ]
}
```

4.  **Importante**: Reemplaza `<NOMBRE_DE_TU_BUCKET_S3>` con el nombre exacto de tu bucket.
5.  Revisa y nombra la política (ej. `S3-Read-SettingsFile-Policy`), luego haz clic en **Create policy**.

-----

## Paso 3: Configurar la Variable de Entorno en Amplify 🔑

Para evitar escribir el nombre del bucket directamente en el código, lo configuramos como una variable de entorno.

1.  En la consola de tu aplicación de **Amplify**, ve a **Build settings**.
2.  Baja hasta la sección **Environment variables** y haz clic en **Edit**.
3.  Añade una nueva variable:
      * **Variable**: `S3_CONFIG_BUCKET`
      * **Value**: El nombre de tu bucket de S3 (ej. `ppedemo-stack-webappbucket-xxxxxxxxx`).
4.  Guarda los cambios.

-----

## Paso 4: Modificar el Archivo de Compilación `amplify.yml` 📄

Finalmente, edita la configuración de compilación para que use el rol y la variable de entorno para descargar el archivo antes de construir el proyecto.

1.  Asegúrate de tener un archivo `amplify.yml` en la raíz de tu repositorio. Si no lo tienes, créalo.
2.  Reemplaza su contenido con el siguiente código:

<!-- end list -->

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        # Descarga el archivo settings.js desde S3 a la carpeta 'public'
        # La carpeta 'public' se incluye automáticamente en el build de React
        - aws s3 cp s3://${S3_CONFIG_BUCKET}/settings.js public/settings.js
    build:
      commands:
        - npm ci
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

Este script le indica a Amplify que, antes de ejecutar el build (`npm run build`), debe copiar el archivo `settings.js` desde el bucket S3 (cuyo nombre está en la variable `$S3_CONFIG_BUCKET`) a la carpeta `public` de tu proyecto.

Una vez completados estos pasos, haz `commit` y `push` de tu archivo `amplify.yml` a tu repositorio. Amplify iniciará un nuevo despliegue utilizando la configuración actualizada.
Your application is now live and connected to its backend\!
