#!/bin/bash

for file in $(seq 0 50)
do
    node newsCrawler.js ${file}
done
