# Express API image — works on Render, Railway, Fly.io, Cloud Run, any VPS.
#
#   docker build -t portfolio-api ./server
#   docker run -p 4000:4000 --env-file server/.env -v portfolio-data:/data portfolio-api
#
# The JSON store + uploaded images are kept in /data (see the VOLUME below), so
# mount a volume to survive restarts. The Firebase service account is NOT copied
# into the image — pass it as the FIREBASE_SERVICE_ACCOUNT env var instead.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=4000 \
    HOST=0.0.0.0 \
    DATA_DIR=/data \
    UPLOAD_DIR=/data/uploads

WORKDIR /app

# Dependencies first so this layer stays cached between code changes.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

RUN mkdir -p /data/uploads

VOLUME ["/data"]

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(function(r){process.exit(r.ok?0:1)}).catch(function(){process.exit(1)})"

CMD ["node", "src/index.js"]
