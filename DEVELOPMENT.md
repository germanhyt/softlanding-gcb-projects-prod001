
============================

Core Framework
✅ Astro 
✅ React 18 + React DOM
✅ TypeScript
Estilos
✅ Tailwind CSS 3 (versión estable)
✅ @tailwindcss/typography
✅ PostCSS
✅ Autoprefixer
Fuentes
✅ @fontsource/work-sans (Títulos)
✅ @fontsource/manrope (Texto)
Librerías de UI
✅ Framer Motion (Animaciones)
✅ Swiper (Carousels)
✅ SweetAlert2 (Alertas)


============================

Refactorización
- Aplicamos una variante de los estilos para que sea más vivo el proyecto considerando los diferentes colores del logo
- Además colocamos los diferentes proyecto alrededor del títulos "Grupo Cordillera Blanca SA - Proyectos", similara un sistema planetaario pero que sea profesional, aplicando diferentes animaciones y estilos para que sea más atractivo


============================

Light mode por defecto + toggle dark mode
- Se eliminó el logo en header, centro del cosmos y sección móvil; solo aparece el nombre "Grupo Cordillera Blanca SA"
- El nombre de la empresa en header y centro del cosmos usa un degradado multicolor (dorado → violeta → verde → naranja), tomado de los colores de los planetas del logo
- Light mode activado por defecto; botón luna/sol en el header permite alternar a dark mode (preferencia guardada en localStorage)
- Variables CSS --bg, --text, --muted, --dim, --border, --hdr-bg, --tip-bg, --card-bg, --body-bg, etc. controlan todos los colores en ambos modos
- global.css actualizado para reflejar el fondo claro en el body por defecto


============================

Despliegue y Configuración en Producción (Docker + Nginx)

El proyecto (Portal GCB) se despliega directamente como un sitio web estático utilizando la infraestructura compartida Nginx + Certbot en el servidor VPS.

### 1. Construcción (Build) local
Puesto que Astro genera archivos estáticos (HTML/CSS/JS) sin requerir Node para ejecutarse:
1. En local, ejecutar el comando: `yarn build`
2. Esto generará la carpeta comprimida y minificada `dist/`.

### 2. Subida al servidor
Cargar el contenido de la carpeta `dist/` al VPS (vmi2809688) en la ruta designada para la carpeta del portal web:
Ruta en el servidor: `/home/projects/portalweb/dist`

### 3. Configuración en `docker-compose.yml`
En el archivo base `/home/projects/shared/docker-compose.yml`, se inyecta la carpeta compilada al servicio de Nginx para que la sirva:
```yaml
services:
  nginx:
    # ...
    volumes:
      # (otros volumenes)
      - /home/projects/portalweb/dist:/usr/share/nginx/portalweb:ro
```

### 4. Configuración en Nginx Proxy (`nginx.conf`)
En el archivo global de Nginx (`/home/projects/shared/nginx.conf`), se mapea el dominio principal **gcbprojects.site** para que sirva los estáticos de la app:

```nginx
server {
    listen 443 ssl;
    server_name gcbprojects.site www.gcbprojects.site;

    ssl_certificate /etc/letsencrypt/live/gcbprojects.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gcbprojects.site/privkey.pem;

    root /usr/share/nginx/portalweb;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optimización: Caché estricta para assets compilados por Astro
    location ~* \.(js|css|png|jpg|jpeg|svg|ico|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location ^~ /.well-known/acme-challenge/ {
        root /usr/share/nginx/html;
        try_files $uri =404;
    }
}
```

### 5. Configuración de Certificados SSL (Certbot)
En caso de tener que generar o renovar por primera vez el SSL para el dominio:
1. (Si hubo intentos incompletos antes) limpiar versiones antiguas en la carpeta `/home/projects/shared/`:
   ```bash
   rm -rf letsencrypt/archive/gcbprojects.site
   rm -rf letsencrypt/live/gcbprojects.site
   rm -f letsencrypt/renewal/gcbprojects.site.conf
   ```
2. Lanzar la petición vía contenedor (certbot intercepta en `/webroot` gracias a las rutas de nginx):
   ```bash
   docker exec -it certbot certbot certonly --webroot -w /webroot -d gcbprojects.site -d www.gcbprojects.site
   ```

### 6. Reinicio para aplicar cambios
En la ruta `/home/projects/shared/`, ejecutar:
```bash
docker-compose up -d
docker restart nginx_proxy
```
