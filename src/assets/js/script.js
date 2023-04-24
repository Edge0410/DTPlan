function fetchPlans() {
  return new Promise(resolve => {
      setTimeout(() => {
          $("#counter").html("");
          $.ajax({
            url: "http://localhost:8888/fetch-wplans",
            type: "GET",
            dataType: "json",
            success: function (res) {
              console.log(res);
              $("#counter").html(res.balance[0].name);
            },
          });
          resolve('updated plan list');
      }, 100);
  });
}

$(document).ready(async function () {
  const retrieve_bal = await fetchPlans();
});