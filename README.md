![preview](https://github.com/rootsofworld/newsword/blob/ab140f14ea3dc2d8e925a5070d5f6d0630d35dde/asset/view.png)
![table](https://github.com/rootsofworld/newsword/blob/ab140f14ea3dc2d8e925a5070d5f6d0630d35dde/asset/table.png)
# Function
* Upload csv file from crowdtangle
* When upload success, put the file's content in _Waiting directory
* Auto crawl news content from the posts in _Waiting dir
* If crawl failed, put failed post in _Failed dir
* CLIENT: Query data & keyword filter & Export to csv

# Requirement
* Node.js v8.9.4


# Use
    //server
    npm install
    npm i -g concurrently
    npm run start
