// components/my-component/my-component.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
      title: {
        type: String,
        value: '默认标题'
      }
    },
  
    /**
     * 组件的初始数据
     */
    data: {
  
    },
  
    /**
     * 组件的方法列表
     */
    methods: {
      onTap() {
        this.triggerEvent('customevent', {
          message: '来自自定义组件的事件'
        })
      }
    }
  })