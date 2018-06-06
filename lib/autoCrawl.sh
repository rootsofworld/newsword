#!/bin/bash

for file in $(seq 13 46)
do
    node newsCrawler.js ${file}
done
