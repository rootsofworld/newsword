功能
將FB新聞相關粉絲專頁的貼文抓取後
根據貼文的連結去抓取原始新聞文章

目的
測試小編貼文與原文的相似程度


目前架構
要爬的專頁id (target_list.json) + cmd input (since,until,limit) -> main.js
main.js -> 批量呼叫 evalSPA() function -> 把結果整合後輸出成csv

evalSPA() : {
    根據需求產生FB graph api URL
    call extractArticle() -> 非同步地根據時間區段內所有link型貼文的連結去抓取網頁內容
    目前的clean機制寫死在extractArticle內
    考慮分出一個cleaner()，輸入回傳的html和指定的抓取規則
} 
 