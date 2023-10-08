#include<stdio.h>
#include<stdlib.h>
#include<string.h>
struct Node{
	int number,age;
    char *name,*gender;
	struct Node * next; 
};
typedef struct Node  * PtrNode;
PtrNode  initEmptyList();//初始化链表
void insertBegin(PtrNode head, int a,char* name,char* gender,int age);//从头插入一个元素
void printList(PtrNode head);//打印链表
PtrNode reverselink(PtrNode head);//逆置链表
void destroyList(PtrNode headPtr);//释放链表
PtrNode checkout(int start,PtrNode head2);//寻找开始的位置，找到则返回指针
int countremain(PtrNode head2);//记录剩余人数
int main(){
    PtrNode head=NULL,head2=NULL;
    int n,number,age,start,interval,remain,count=1;
    char *name,*gender;
    scanf("%d",&n);
    head=initEmptyList();
    for(int i=0;i<n;i++){//读入人员信息
        name=malloc(50*sizeof(char));
        gender=malloc(10*sizeof(char));
        scanf("%d %s %s %d",&number,name,gender,&age);
        insertBegin(head,number,name,gender,age);//头插人员信息
    }
    head2=reverselink(head);//逆置得到正序的链表
    printList(head2);//第一次输出人员信息
    scanf("%d %d %d",&start,&interval,&remain);
    PtrNode control=checkout(start,head2),controlfront=head2;
    while(control==NULL){//如果没有找到开始的编号，重新输入再次寻找
        printf("Not found.Please input again:\n");
        scanf("%d",&start);
        control=checkout(start,head2);
    }
    while(countremain(head2)>remain){//实际剩余人数大于目标剩余人数则持续进行
        count=1;
        while(count<interval){//记录间隔人数
            if(control==head2)//循环到头指针时跳过
                control=control->next;
            else{
                count++;
                control=control->next;
                if(control==head2)//循环到头指针时跳过
                    control=control->next;
            }
        }
        while(controlfront->next!=control)//得到当前指针的前驱指针
            controlfront=controlfront->next;
        controlfront->next=control->next;//记录将要删除节点的下一节点
        printf("%d %s %s %d\n",control->number,control->name,control->gender,control->age);
        free(control);
        control=controlfront->next;//当前指针指向下一个节点
    }
    printList(head2);
    destroyList(head2);
    return 0;
}
PtrNode  initEmptyList(){
	PtrNode head = malloc(sizeof(struct Node));//动态分配新节点
	if ( head != NULL){
		head->next = head;
	} 
	return head;
}
void insertBegin(PtrNode head,int a,char* name,char* gender,int age){
	PtrNode p;//动态分配新节点，将新值存入
	p = malloc(sizeof(struct Node));
	if (p != NULL){
		p->number=a;
        p->name=name;
        p->gender=gender;
        p->age=age;
		p->next=head->next;//直接在空节点后链接新节点
		head->next=p;
	}
	else 
        printf("Not inserted. No memory avaliable.\n");
}
void printList(PtrNode head){
    PtrNode cur=head->next; //跳过空节点
    if (cur==head)
    	   printf("The list is empty.\n");
    else{
	   printf("The list is:\n");
	   while(cur!=head){
   	        printf("%d %s %s %d\n",cur->number,cur->name,cur->gender,cur->age);
             cur = cur->next;
         } 
        cur=cur->next;
    }
}
void destroyList(PtrNode headPtr)
{
    PtrNode tempPtr;
    while (headPtr->next!=headPtr){
        tempPtr=headPtr->next;
        headPtr->next=tempPtr->next;
        free(tempPtr);
    }
    tempPtr=headPtr;
    free(tempPtr);
    headPtr=NULL;
}
PtrNode reverselink(PtrNode head)
{
    PtrNode temp=head->next,track=NULL,head2=NULL;
    head2=initEmptyList();
    while(temp!=head){
        track=head2->next;//记录链表2后继
        head2->next=temp;//读取链表1中元素
        temp=temp->next;//移向下一个节点
        head2->next->next=track;//将链表2后继连上去
    }
    free(head);
    return head2;
}
PtrNode checkout(int start,PtrNode head2)
{
    PtrNode check=NULL;
    check=head2->next;
    while(check->next!=head2){//遍历链表，按编号寻找开始位置
        if(check->number==start)
            return check;
        check=check->next;
    }
    if(check->number!=start)
        return NULL;
    return NULL;
}
int countremain(PtrNode head2)
{
    int num=1;
    PtrNode temp=head2->next;
    if(temp==head2)
        num=0;
    while(temp->next!=head2){
        num++;
        temp=temp->next;
    }
    return num;
}