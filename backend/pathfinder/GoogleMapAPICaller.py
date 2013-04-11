import urllib, json
import pprint
import time

class GoogleMapAPICaller(object):
    
    def getPathDistance(self, lat1, lon1, lat2, lon2):
        """Note: Call to google map api should not reach 2500/day or 10/second so avoid calling it in a tight loop
        To use it in a tight loop, consider using time.sleep(seconds)"""        
        #sensor: for dynamic locating e.g. mobile
        #region: so that search Edmonton is more likely to result in Edm, AB not Edm, Uk for example
        URLusingLatLong = "http://maps.googleapis.com/maps/api/directions/json?origin="+ str(lat1) + "," + str(lon1) +"&destination="+ str(lat2) +","+ str(lon2) +"&sensor=false&mode=walking"
        time.sleep(0.2)
        googleResponse = urllib.urlopen(URLusingLatLong);
        jsonResponse = json.loads(googleResponse.read())
        for i in range(6):
            print "Google status is", jsonResponse['status']
            if (jsonResponse["status"] == 'OK'):
                break
            time.sleep(0.2)
            googleResponse = urllib.urlopen(URLusingLatLong);
            jsonResponse = json.loads(googleResponse.read())
        if (jsonResponse["status"] == 'OK'):
            distance = jsonResponse['routes'][0]['legs'][0]['distance']['value']
            return distance
    #     test = json.dumps([s['geometry']['location'] for s in jsonResponse['results']], indent=3)
    #     print(test)
    
if __name__ == '__main__':
    caller = GoogleMapAPICaller()
    print caller.getPathDistance(53.525398, -113.526382, 53.526714, -113.525000)