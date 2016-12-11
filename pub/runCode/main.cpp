#include <stdio.h>
#include <time.h>
#include <stdlib.h>
#include <math.h>

double test(double x)
{
  static int count = 0;
  int i; 
  
  // Test Array
  int ALen = 1;
  int *A = new int[ALen];
  for (i=0;i<ALen;i++)
  {
    A[i] = i;
  }
  
  // Test computation
  for (i=0;i<160000000;i++)
  {
    double r = ((double) rand() / (RAND_MAX));
    double r1 = exp(r);
    double r2 = log(r);
    double r3 = r1*r2*r3;
  }
  
  double y = x;
  
  // Test function call
  if (count == 1) { return y; }
  else { count++; return test(y); }
}



int main(int argc, char *argv[])
{
  time_t sec1, sec2;
  sec1 = time (NULL);
  /**************************************************************************************/

  double y = test(4);
  
  printf("%f", y);



  /**************************************************************************************/
  sec2 = time (NULL);
  printf ("\n\nExecution time: %ld", sec2-sec1);
  char buffer[26];
  struct tm* tm_info;
  time(&sec2);
  tm_info = localtime(&sec2);
  strftime(buffer, 26, "%Y-%m-%d %H:%M:%S", tm_info);
  printf ("\nTime stamp: %s", buffer);
  return 0;
}
