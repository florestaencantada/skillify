# Skillify

## Docker

This project is a Vite React frontend. Tailwind and PostCSS run during `npm run build`, then a small Node server serves the static `dist` output.

### Environment

Copy `.env.example` to `.env` and set:

```dotenv
VITE_API_URL=http://skillrush.florestaencantada.ia.br/api
APP_PORT=8080
DEV_PORT=5173
```

`VITE_API_URL` is public frontend configuration. The Docker image also writes `/env.js` at startup, so the backend URL can be changed with container environment variables without rebuilding the image.

### Production

```bash
docker compose up --build frontend
```

Open `http://localhost:8080`, or change `APP_PORT` in `.env`.

### Development

```bash
docker compose --profile dev up --build frontend-dev
```

Open `http://localhost:5173`, or change `DEV_PORT` in `.env`. Source files are bind-mounted and Vite runs with polling enabled for reliable Tailwind/HMR updates in Docker.

### Direct Docker Build

```bash
docker build -t skillify-frontend .

docker run --rm \
  -p 8080:8080 \
  -e VITE_API_URL=http://backend.skillrush.florestaencantada.ia.br \
  skillify-frontend
```

### EKS Runtime Notes

The production image is ready to run as a Kubernetes workload behind an AWS Gateway API ALB Controller route.

Use these container assumptions when you create manifests later:

- Container port: `8080`
- Health check path: `/health`
- Runtime configuration: set `VITE_API_URL` as an environment variable
- Security: the container runs as the non-root `node` user
- Shutdown: the server handles `SIGTERM` for normal pod termination

Do not bake `.env` into the image. Build the image once, push it to ECR, and provide `VITE_API_URL` from Kubernetes runtime configuration.
