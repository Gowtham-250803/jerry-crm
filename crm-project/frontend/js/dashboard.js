const revenueChart = document.getElementById('revenueChart');

new Chart(revenueChart, {

  type:'line',

  data:{
    labels:['Jan','Feb','Mar','Apr'],

    datasets:[{
      label:'Revenue',

      data:[40000,60000,80000,100000],

      borderWidth:3
    }]
  }

});
