
window.addEventListener('load', function()
{
	var divStatus = document.createElement('div');
	divStatus.id = 'status';	    
	document.body.appendChild(divStatus);
	var divMap = document.createElement('div');
	divMap.id = 'map';
	divMap.style.marginTop = '-25px';
  O('wikibody').appendChild(divMap);

	if (typeof navigator.geolocation == 'undefined')
		 alert("Geolocation not supported.")
	else
		navigator.geolocation.getCurrentPosition(granted, denied)
	function granted(position)
	{
		O('status').innerHTML = 'Permission Granted'
		S('map').border       = '1px solid black'
		S('map').width        = window.innerWidth*0.9+'px'
		S('map').height       = window.innerHeight*0.9+'px'
		var lat   = position.coords.latitude
		var long  = position.coords.longitude
		var gmap  = O('map')
		var gopts =
		{
			center: new google.maps.LatLng(lat, long),
			zoom: 18, mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		var map = new google.maps.Map(gmap, gopts)
		
///////////
  var geocoder = new google.maps.Geocoder;
  geocodeLatLng(geocoder, map, lat, long);
///////////        

	}
	function denied(error)
	{
		var message
		switch(error.code)
		{
			case 1: message = 'Permission Denied'; break;
			case 2: message = 'Position Unavailable'; break;
			case 3: message = 'Operation Timed Out'; break;
			case 4: message = 'Unknown Error'; break;
		}
		O('status').innerHTML = message
	}
}, false);

function geocodeLatLng(geocoder, map, latValue, longValue) {

  var latlng = {lat: parseFloat(latValue), lng: parseFloat(longValue)};
  geocoder.geocode({'location': latlng}, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      if (results[1]) {

        var marker = new google.maps.Marker({
          position: latlng,
          map: map
        });

console.log(results[3].types[0]);
console.log(results[3].formatted_address);
console.log(results[0].types[0]);
console.log(results[0].formatted_address);
console.log(results[8].types[0]);
console.log(results[8].formatted_address);


      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}
