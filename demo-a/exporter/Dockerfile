FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app

# Install playwright browsers
RUN npx playwright install chromium

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 8082

CMD ["node", "src/server.js"]
