[@    1| <?php
    2| 
    3| $a  =1;
    4| if ($a == 1) { $b = 2; }
    5| echo $b;
    6| 
    7| 
    8| $file = '../../pmwikiTimeStamp/pmwikiTimeStamp.txt';
    9| #$file = 'cookbook/PLUGIN_LSMENG.php';
   10| #$file = 'pmwiki.php';
   11| $str = file_get_contents($file);
   12| echo $str;
   13| #shell_exec("rm -f ".$file);
   14| 
   15| 
   16| /*
   17| $message = "Line 1\r\nLine 2\r\nLine 3";
   18| $result = mail('f95942117@gmail.com', '12/3 test', $message);
   19| echo $result;
   20| $result = mail('sam_meng@htc.com', '12/3 test', $message);
   21| echo $result;
   22| $result = mail('f95942117@ntu.edu.tw', '12/3 test', $message);
   23| echo $result;
   24| */@]