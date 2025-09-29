# Guía de Conexión y Despliegue en AWS

Esta guía breve explica cómo desplegar los recursos backend para la demo de Detección de EPP (PPE) usando la Solución de Amazon Rekognition (Amazon Rekognition PPE) y cómo conectar esta aplicación React.

## 1. Desplegar el Stack de CloudFormation
Elige la región de AWS donde deseas desplegar y lanza la última plantilla. Debes iniciar sesión con un usuario/rol IAM que tenga permisos para crear stacks de CloudFormation (normalmente: CloudFormation, IAM, S3, Lambda, Rekognition, API Gateway, CloudFront, Logs).

| Región | Lanzar Plantilla |
| ------ | ---------------- |
| US East (N. Virginia) (us-east-1) | [Lanzar Stack](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=PPEDemo&templateURL=https://solution-builders-us-east-1.s3.us-east-1.amazonaws.com/amazon-rekognition-ppe/latest/template.yaml) |
| US East (Ohio) (us-east-2) | [Lanzar Stack](https://console.aws.amazon.com/cloudformation/home?region=us-east-2#/stacks/new?stackName=PPEDemo&templateURL=https://solution-builders-us-east-2.s3.us-east-2.amazonaws.com/amazon-rekognition-ppe/latest/template.yaml) |
| US West (Oregon) (us-west-2) | [Lanzar Stack](https://console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/new?stackName=PPEDemo&templateURL=https://solution-builders-us-west-2.s3.us-west-2.amazonaws.com/amazon-rekognition-ppe/latest/template.yaml) |
| EU (Irlanda) (eu-west-1) | [Lanzar Stack](https://console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/new?stackName=PPEDemo&templateURL=https://solution-builders-eu-west-1.s3.eu-west-1.amazonaws.com/amazon-rekognition-ppe/latest/template.yaml) |
| Asia Pacífico (Singapur) (ap-southeast-1) | [Lanzar Stack](https://console.aws.amazon.com/cloudformation/home?region=ap-southeast-1#/stacks/new?stackName=PPEDemo&templateURL=https://solution-builders-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/amazon-rekognition-ppe/latest/template.yaml) |

### Durante la Creación del Stack
1. Abre el enlace de tu región.
2. (Opcional) Ajusta el nombre del stack (por defecto: `PPEDemo`).
3. Acepta los avisos de capacidades IAM si aparecen.
4. Haz clic en Create Stack y espera hasta que el estado sea `CREATE_COMPLETE`.

## 2. Obtener `settings.js`
Después de que el stack finalice:
1. Ve a la consola de CloudFormation y abre tu stack `PPEDemo`.
2. En la pestaña **Resources**, localiza el recurso S3 Bucket creado para los assets o configuración web (Tipo: `AWS::S3::Bucket`).
3. Ábrelo en la consola de S3.
4. Localiza el archivo generado `settings.js` (a menudo en la raíz del bucket). Descárgalo.

Si no estás seguro de qué bucket es: normalmente sólo habrá un bucket nuevo de la solución para la configuración web. También puedes buscar en S3 por un bucket creado recientemente que contenga `ppe` o `rekognition` en el nombre.

## 3. Colocar `settings.js` en la Carpeta de Build
Copia el archivo descargado `settings.js` dentro de la carpeta `build` del proyecto, junto a `index.html`:

```
/build
  index.html
  settings.js  <-- copiar aquí
  static/
  ...
```

¿Por qué en `build/` y no en `src/`? La aplicación carga configuración en tiempo de ejecución desde un archivo estático servido con los assets desplegados. Reemplazar `settings.js` tras cada despliegue del backend te permite actualizar endpoints sin reconstruir el bundle de React.

Si aún no has construido la app localmente, ejecuta:
```
npm install
npm run build
```
Luego copia `settings.js` en la carpeta `build` recién creada.

## 4. Desplegar el Frontend
Ahora puedes alojar el contenido de `build/` (incluyendo el nuevo `settings.js`) en:
- Amazon S3 + CloudFront
- Cualquier servicio de hosting estático

Si usas S3 con hosting estático, recuerda establecer encabezados `Cache-Control` adecuados o realizar invalidaciones para que los clientes obtengan la última versión de `settings.js`.