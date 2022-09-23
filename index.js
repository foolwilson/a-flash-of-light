let service;
let position;
let restaurants;

const initialize = async function () {
  // 初始化 popover 功能
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
  const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))

  // 創建一個 Html Tag 容器給 google map API 使用
  const container = document.createElement('div');

  // 創建一個 google map 的服務器
  service = new google.maps.places.PlacesService(container);

  // 設定監聽選項顯示功能
  document.getElementById('selectAll').addEventListener('click', e => selectAll());

  const options = document.getElementsByName('options');
  options.forEach(option => option.addEventListener('click', () => {
    const all = document.getElementById('selectAll');
    let checkedCount = 0;
    options.forEach(option => {
      if (option.checked) checkedCount++;
    });

    switch (checkedCount) {
      case 0:
        all.checked = false;
        all.indeterminate = false;
        break;
      case options.length:
        all.checked = true;
        all.indeterminate = false;
        break;
      default:
        all.checked = false;
        all.indeterminate = true;
        break;
    }

    // 隱藏結果的 Element
    document.getElementsByClassName('restaurant')[0].style.display = 'none';

    // 若已有位置資訊，則設定查詢按鈕
    if (!!position) {
      setSearchBtn();
    }
  }));

  // 設定使用者位置
  getUserPosition();
}

const getUserPosition = function () {
  navigator.geolocation.getCurrentPosition(
    ({ coords: { latitude, longitude } }) => {
      // 取得使用者的位置並設定在 google map 上
      position = new google.maps.LatLng(latitude, longitude);

      // 設定查詢按鈕
      setSearchBtn();
    },
    (error) => {
      console.log(error);
      const modal = new bootstrap.Modal('.modal');
      modal.show();
    },
    { timeout: 5000 }
  );
}

const search = function () {
  // 隱藏結果的 Element
  document.getElementsByClassName('restaurant')[0].style.display = 'none';

  // 設定 google map 服務器的 Request Body
  const request = {
    location: position,
    language: 'zh-TW',
    radius: '150',
    keyword: getKeywords() || ['food'],
    openNow: true,
    rankBy: google.maps.places.RankBy.PROMINENCE,
    type: ['restaurant']
  };

  console.log(request);

  // 
  service.nearbySearch(
    request,
    (results, status, pagination) => {
      switch (status) {
        case google.maps.places.PlacesServiceStatus.OK:
          restaurants = results;
          chooseOne();

          // 顯示結果的 Element
          document.getElementsByClassName('restaurant')[0].style.display = 'flex';

          // 更新按鈕
          const searchBtn = document.getElementById('search');
          searchBtn.classList.remove('btn-outline-success');
          searchBtn.classList.add('btn-outline-danger');
          searchBtn.innerText = '我想換一家QQ';
          searchBtn.onclick = chooseOne;
          break;
        case google.maps.places.PlacesServiceStatus.NOT_FOUND:
        case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
          alert('查無結果，請重新設定條件後再次查詢～');
          break;
        case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
        case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
        case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
        case google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR:
          break;
        }
    }
  );
}

const chooseOne = function () {
  const randomNum = Math.floor(Math.random() * restaurants.length);
  
  const restaurant = restaurants.splice(randomNum, 1)[0];
  // 如果有餐廳資訊
  if (!!restaurant) {
    // 更新查詢結果圖片
    const restaurantPhoto = document.querySelector('.restaurant>img');
    restaurantPhoto.src = (restaurant.photos && restaurant.photos[0].getUrl()) || '/a-flash-of-light/static/fake.jpg';
    
    // 更新查詢結果資訊
    const restaurantName = document.querySelector('.restaurant>a');
    restaurantName.innerText = restaurant.name;
    restaurantName.href = `https://www.google.com/maps/search/?api=1&query=${restaurant.name}`;
  } else {
    // 設定圖片
    document.querySelector('.restaurant>img').src = '/a-flash-of-light/static/no-picture.jpg';
    
    // 更改文字訊息
    const restaurantName = document.querySelector('.restaurant>a');
    restaurantName.innerText = 'Oops～看來找不到你喜歡的餐廳，請重新設定條件再查詢看看，或點我開起 Google Map 查詢附近的餐廳';
    restaurantName.href = 'https://www.google.com/maps/search/?api=1&query=餐廳';

    // 設定查詢按鈕
    setSearchBtn();
  }
}

const getKeywords = function () {
  const options = document.getElementsByName('options');
  const other = document.getElementById('other');
  let keyword = [];

  // 將結果存進 keyword array
  options.forEach(o => {
    if (o.checked) { 
      keyword.push(o.defaultValue);
    }
  });

  if (other.checked) {
    const otherOptions = document.getElementsByName('other-option')[0];
    keyword.push(...otherOptions.value.split(/,|，|\s/));
  }

  return (keyword.length && keyword) || null;
}

const addOtherOption = function () {
  const other = document.getElementsByName('other-option')[0];
  other.disabled = !other.disabled;
  other.focus();

  // 隱藏結果的 Element
  document.getElementsByClassName('restaurant')[0].style.display = 'none';

  // 若已有位置資訊，則設定查詢按鈕
  if (!!position) {
    setSearchBtn();
  }
}

const selectAll = function () {
  const all = document.getElementById('selectAll');
  const options = document.getElementsByName('options');
  options.forEach(o => o.checked = all.checked );
  
  // 若已有位置資訊，則設定查詢按鈕
  if (!!position) {
    setSearchBtn();
  }
}

const setSearchBtn = function () {
  const searchBtn = document.getElementById('search');

  // 移除 disabled 屬性
  searchBtn.removeAttribute('disabled');

  // 移除其他按鈕的 class style
  searchBtn.classList.remove('btn-outline-secondary');
  searchBtn.classList.remove('btn-outline-danger');

  // 增加 search button 的 class style
  searchBtn.classList.add('btn-outline-success');

  // 調整顯示字樣及更改點擊事件觸發的 method
  searchBtn.innerText = '開始搜尋～';
  searchBtn.onclick = search;
}

const closePage = function () {
  window.open('', '_self', '');
  window.close();
}

window.initialize = initialize;
