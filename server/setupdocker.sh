#!/bin/bash
docker run --name uhub-postgres -e POSTGRES_DB=uhub -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine