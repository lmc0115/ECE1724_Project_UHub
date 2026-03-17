# You need to have the .env file in the server directory before running this script!!!!!!!!!!!!!
#!/bin/bash
npm install
npx prisma migrate dev
npx prisma db seed