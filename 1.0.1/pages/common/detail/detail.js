Page({
  data: {
    title: '详情',
    articleTitle: '',
    date: '',
    content: []
  },
  onLoad(options) {
    const { title, type, id } = options
    this.setData({ 
      title: title || '详情',
      date: new Date().toLocaleDateString()
    })
    this.loadContent(type, id)
  },
  loadContent(type, id) {
    let articleTitle = ''
    let content = []

    switch(type) {
      case 'emergency':
        articleTitle = '急诊就医指南'
        content = [
          '1. 遇到紧急情况，请立即拨打120急救电话。',
          '2. 请保持镇静，清晰描述患者位置、症状及联系方式。',
          '3. 在等待救护车时，请尽量不要移动患者，除非环境不安全。',
          '4. 准备好患者的医保卡、病历本及随身物品。'
        ]
        break;
      case 'insurance':
        articleTitle = '医保报销政策说明'
        content = [
          '基本医疗保险参保人员在定点医疗机构就医，可享受医疗费用报销。',
          '门诊报销比例：社区医院约为90%，三级医院约为70%。',
          '住院起付线：三级医院1000元，二级医院500元。',
          '具体报销比例及限额请咨询当地社保局或拨打12333服务热线。'
        ]
        break;
      case 'safety':
        articleTitle = '食品安全与过敏提示'
        content = [
          '选购预包装食品时，请仔细阅读标签，注意生产日期和保质期。',
          '常见的过敏原包括：牛奶、鸡蛋、花生、坚果、海鲜、大豆和小麦。',
          '在外就餐时，如有过敏史，请务必提前告知服务员或厨师。',
          '保持厨房清洁，生熟分开，食物煮熟煮透。'
        ]
        break;
      case 'property':
        articleTitle = '物业服务公告'
        content = [
          '尊敬的业主：',
          '为提升小区环境，物业将于下周一进行绿化修剪工作。',
          '请勿将车辆停放在草坪附近，以免划伤。',
          '感谢您的配合与支持！'
        ]
        break;
       case 'article':
        articleTitle = `详情展示 (ID:${id || '未知'})`
        content = [
          '这是一篇模拟的详情文章。',
          '在实际应用中，这里将展示从服务器获取的富文本内容或详细信息。',
          '您可以通过点击列表页的不同项目来查看不同的详情。'
        ]
        break;
      default:
        articleTitle = '相关说明'
        content = ['暂无详细内容，请稍后再试。']
    }
    this.setData({ articleTitle, content })
  }
})