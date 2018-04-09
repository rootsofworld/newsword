#!/bin/bash

for file in *.csv
do
    csv2json $file ../data/crowdtangle/$file.json
    echo $file
done
