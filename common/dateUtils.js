var moment = require('moment');

exports.getCurrentDate = function () {
  moment.locale('zh-cn');
  var _today = moment();
  return _today.format('YYYY-MM-DD'); /*现在的时间*/
};

exports.getCurrentDateTime = function () {
  moment.locale('zh-cn');
  var _today = moment();
  return _today.format('YYYY-MM-DD HH:mm:ss'); /*现在的时间*/
};