FROM docker.io/node:24-trixie-slim AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.build.json tsconfig.json nest-cli.json ./

RUN npm ci --ignore-scripts

COPY src ./src

RUN npm run build
RUN npm prune --production

FROM gcr.io/distroless/nodejs24-debian13:nonroot AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NO_COLOR="true"

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER nonroot

EXPOSE 3344 9090

CMD ["-e", "fetch('https://api.h5p.org/v1/content-types/', {method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'core_api_version=1.27&disabled=0&h5p_version=1.27.0&local_id=55ae13958a8eb4927612f4d74f2d375ca285afffc80bd67d84be5de1db53ace0&platform_name=H5P-Editor-NodeJs&platform_version=0.10&type=local&uuid=7608c5ab-5da3-476c-9196-ffc3a46e6d1b'}).then(r => r.text()).then(console.log).catch(console.error)"]

