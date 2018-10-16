#!/bin/bash

for file in $(seq 0 25)
do
    node newsCrawler.js ${file}
done
