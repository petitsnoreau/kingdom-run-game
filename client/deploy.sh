#!/bin/bash

rm ./dist/*
rm /var/www/html/apps/kingdom-run/*

parcel build index.html --public-url '.'

cp ./dist/* /var/www/html/apps/kingdom-run/

chown www-data:www-data /var/www/html/apps/kingdom-run/*
