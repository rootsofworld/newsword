from nltk.tag.stanford import NERTagger
import json
from pathlib import Path
import time

db = Path('../data/dumbdb')
file_list = [ x for x in db.iterdir() if x.is_file()]
print (file_list[0])
with open(file_list[0]) as fanpage:
    #print(json.load(fanpage))
    postlist = json.load(fanpage)
    for post in postlist['posts']:
        article = post['article']
        
