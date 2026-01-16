Page({
  data:{
    theme:'light',
    loading:true,
    isRefreshing:false,
    likeList:[],
    page:1,
    hasMore:true
  },
  onLoad(){
    this.loadTheme();
    this.fetchList();
  },
  loadTheme(){
    const idx=wx.getStorageSync('themeIndex')||0;
    const map=['light','dark','auto'];
    let theme=map[idx];
    if(theme==='auto') theme=wx.getSystemInfoSync().theme==='dark'?'dark':'light';
    this.setData({theme});
  },
  fetchList(reset=false){
    const page=reset?1:this.data.page;
    if(reset) this.setData({likeList:[],hasMore:true});
    wx.request({
      url:'https://your.api/like/list',
      data:{page,size:10},
      header:{Authorization:wx.getStorageSync('token')},
      success:res=>{
        const rows=res.data.data||[];
        this.setData({
          loading:false,
          isRefreshing:false,
          likeList:reset?rows:[...this.data.likeList,...rows],
          hasMore:rows.length===10,
          page:reset?2:this.data.page+1
        });
      },
      fail:()=>{
        this.setData({loading:false,isRefreshing:false});
      }
    });
  },
  onRefresh(){
    this.setData({isRefreshing:true});
    this.fetchList(true);
  },
  onLoadMore(){
    if(!this.data.hasMore) return;
    this.fetchList();
  },
  goDetail(e){
    const id=e.currentTarget.dataset.id;
    wx.navigateTo({url:`/pages/detail/index?id=${id}`});
  }
});