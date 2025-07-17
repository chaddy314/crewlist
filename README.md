# Crewlist

Assign Emergency Roles for a small to medium sized sailing crew and export the list as PDF.
This is a small test project using Nuxt UI.

## Setup

Make sure to install the dependencies:

```bash
# pnpm
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# pnpm
pnpm run dev
```


## Docker

Build docker image

```bash
docker build . -t crewlist-image
```

Run docker container:

```bash
docker run --name crewlist-container -p 3000:80 -d crewlist-image
```
The site should now be available at `http://localhost:3000`.
## Production

Build static site for production:

```bash
# pnpm
pnpm nuxt generate
```

Locally preview production build:

```bash
# pnpm
npx serve .output/public 
```
The site should now be available to preview at `http://localhost:3000`.

