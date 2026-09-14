FROM node:20-slim

# git nécessaire pour certaines dépendances npm installées depuis un repo git
# python3/pip pour yt-dlp, ffmpeg pour l'extraction audio (mp3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "index.js"]
