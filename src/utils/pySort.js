export const pySort = (arr, empty) => {
  if (!String.prototype.localeCompare) return null;
  var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789'.split('');
  var zh = '阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀'.split(''); // 乱码
  var arrList = [];
  for (var m = 0; m < arr.length; m++) {
    if (arr[m].name == null) {
      arr[m].name = arr[m].userId;
    }
    arrList.push(arr[m]);
  }
  var result = [];
  var curr;
  for (var i = 0; i < letters.length; i++) {
    curr = { letter: letters[i], data: [] };
    if (i != 36) {
      for (var j = 0; j < arrList.length; j++) {
        var initial = arrList[j].name.charAt(0); //截取第一  个字符
        if (arrList[j].name.charAt(0) == letters[i] || arrList[j].name.charAt(0) == letters[i].toLowerCase()) {
          //首字符是英文的
          curr.data.push(arrList[j]);
        } else if (zh[i] != '*' && isChinese(initial)) {
          //判断是否是无汉字,是否是中文
          if (initial.localeCompare(zh[i]) >= 0 && (!zh[i + 1] || initial.localeCompare(zh[i + 1]) < 0)) {
            //判断中文字符在哪一个类别
            curr.data.push(arrList[j]);
          }
        }
      }
    } else {
      for (var k = 0; k < arrList.length; k++) {
        var ini = arrList[k].name.charAt(0); //截取第一个字符
        if (!isChar(ini) && !isChinese(ini)) {
          curr.data.push(arrList[k]);
        }
      }
    }
    if (empty || curr.data.length) {
      result.push(curr);
      //curr.data.sort(function(a,b){
      //  return b.localeCompare(a);    //排序,英文排序,汉字排在英文后面
      //});
    }
  }
  // console.log(result);
  return result;
};

const isChinese = (temp) => {
  var re = /[^\u4E00-\u9FA5]/;
  if (re.test(temp)) {
    return false;
  }
  return true;
};

const isChar = (char) => {
  var reg = /[A-Za-z]/;
  if (!reg.test(char)) {
    return false;
  }
  return true;
};
