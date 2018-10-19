var path = require('path');
var fs = require('fs');
var sysConfig = require('./config/sysConfig');
var apiConfig = require('./config/apiConfig');
var dateUtils = require('./common/dateUtils');
var serviceInvokeUtils = require('./common/serviceInvokeUtils');

var second = sysConfig.scheduleIntervalSeconds * 1000;

function processLog() {
  console.log('Processing...');
  var logDir = path.join(path.resolve(__dirname, '..'), sysConfig.logDir);
  var host = apiConfig.StoreService.host;
  var port = apiConfig.StoreService.port;
  var systemLogPath = apiConfig.StoreService.path.systemLog;
  var fileList = fs.readdirSync(logDir);//取得log目录下的所有文件名

  //遍历每一个文件
  fileList.forEach(function (fileName) {
    try{
      var filePath = path.join(logDir, fileName);
      var statInfo = fs.statSync(filePath);
      if(statInfo.isFile() && path.extname(fileName) === '.json'){
        // var filePath = path.join(sysConfig.logDir, fileName);
        var fileContent = fs.readFileSync(filePath, "utf-8");//取得当前文件的内容
        var logObj = JSON.parse(fileContent); //文件文件内容（json格式）转成js对象

        //调用API Service将日志信息保存到数据库中
        serviceInvokeUtils.post(logObj, host, port, systemLogPath, function (result) {
          printProcessLog('==='); //打印分割线
          printProcessLog('processing log: ' + fileName); //打印处理日志
          if(result.err){
            printProcessLog('save data base failed: ' + fileName);
            sendSMS(logObj, fileName, false); //发送短信
            moveFile(fileName, false); //移动文件
          }else{
            printProcessLog('save data base success: ' + fileName);
            sendSMS(logObj, fileName, true); //发送短信
            moveFile(fileName, true); //移动文件
          }
        });
      }
    }catch(err){
      printProcessLog('processing file error: \n ' + fileName + '\n' + err.message ); //打印处理日志
    }

  });
}

function sendSMS(logObj, fileName, saveResult) {
  //todo
  printProcessLog('sand sms to admin: ' + fileName);
}

function moveFile(fileName, saveResult) {
  var sourceFile = path.join(path.resolve(__dirname, '..'), sysConfig.logDir, fileName);
  var processedDir = path.join(path.resolve(__dirname, '..'), sysConfig.processedDir);
  var errorDir = path.join(path.resolve(__dirname, '..'), sysConfig.errorDir);
  var destPath = saveResult ? path.join(processedDir, fileName) : path.join(errorDir, fileName);

  printProcessLog('move file ' + fileName + ' to ' + destPath);

  if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir);
  }

  if (!fs.existsSync(errorDir)) {
    fs.mkdirSync(errorDir);
  }

  fs.rename(sourceFile, destPath, function (err) {
    if (err){
      printProcessLog('move file [' + fileName + '] to ' + destPath + ' failed.');
    }
  });
}

function printProcessLog(msg) {
  var logFileName = dateUtils.getCurrentDate() + '.log';
  var processingDir = path.join(path.resolve(__dirname, '..'), sysConfig.processingDir);

  var logFilePath = path.join(processingDir, logFileName);
  var logContent = '';
  if(msg.indexOf('===') >= 0){
    logContent = '=========================================================';
  }else{
    logContent = '[' + dateUtils.getCurrentDateTime() + ']' + ' ' + msg;
  }

  if (!fs.existsSync(processingDir)) {
    fs.mkdirSync(processingDir);
  }

  console.log(logContent);

  fs.appendFileSync(logFilePath, logContent + '\r\n');
}

console.log('Start...');
setInterval(processLog, second);
// processLog();