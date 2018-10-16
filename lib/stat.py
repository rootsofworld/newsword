import sys
import json
import csv
import codecs
import argparse


parser = argparse.ArgumentParser(description="Get some stat from post2news")
parser.add_argument('file')
args = parser.parse_args()

with open(args.file, encoding='utf-8', mode='r') as data:
    data = json.load(data)
    filtered = [ d for d in data if 'similarity' in d and d['similarity']['ratio'] > 0]
    avg_ratio = sum([f['similarity']['ratio'] for f in filtered]) / len(filtered)
    print(len(data))
    result = {}
    prev = data[0]["Name"]
    result[prev] = {}
    total_ratio = 0
    for el in data:
        if el["Name"] != prev:
            if result[prev]["count"] > 0:
                result[prev]["avg_ratio"] = total_ratio / result[prev]["count"]
            prev = el["Name"]
            result[prev] = {}
            if 'similarity' in el :
                result[prev]["count"] = 1
                total_ratio = el["similarity"]["ratio"]
            else:
                total_ratio, result[prev]["count"] = [0, 0]
        else: 
            if 'similarity' in el :
                total_ratio += el["similarity"]["ratio"]
                if 'count' not in result[prev]:
                    result[prev]["count"] = 1
                else:
                    result[prev]["count"] += 1


        if data.index(el) == len(data) - 1:
            if result[prev]["count"] > 0:
                result[prev]["avg_ratio"] = total_ratio / result[prev]["count"]

    print(result)

    f = codecs.open(args.file.split('.')[0] + '.txt', 'wb', 'utf-16')
    fieldnames = ["Name", "count", "avg_ratio"]
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    for el in result:
        row = result[el]
        row["Name"] = el
        w.writerow(row)
    w.writerow({"Name":'Total', "count":len(data), "avg_ratio":avg_ratio})
    f.close()

    for d in data:
        if 'similarity' not in d:
            print(d["Name"])
        else:
            #print(d["similarity"])
            #print('OK')
            continue
    print("File name: {0}\nNews count: {1}\nAverage Ratio: {2}".format(args.file.split('.')[0], len(data), avg_ratio))
