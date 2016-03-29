from config import config
import ephem
import math
from datetime import datetime

class Solar:
    def __init__(self):
        self.obs = ephem.Observer()
        home = config.home; self.home = home
        self.obs.lat = str(home['lat']) # ephem expects coordinates as strings
        self.obs.lon = str(home['lon']) # ephem expects coordinates as strings

    def time_of_solar_azimuth_today(self, azimuth):
        sun = ephem.Sun()
        sun.compute(self.obs)
        self.obs.date = datetime.utcnow().strftime("%Y/%m/%d %H:%M:%S")
        
        def err_az(x):
            self.obs.date = x
            sun.compute(self.obs)
            err_delta = sun.az - (math.pi/180. * self.home['solar_azimuth'])
            #print('az: ', sun.az, ', solar_azimuth',  self.home['solar_azimuth'], ', delta: ', err_delta)
            return err_delta

        x = self.obs.date
        #print 'Searching for the correct time...'
        ephem.newton(err_az, x, x + 0.01)
        return(self.obs.date)

    def time_of_sunset_today(self):
        #sun = ephem.Sun()
        #sun.compute(self.obs)
        obs = ephem.Observer()
        home = config.home
        obs.lat = str(home['lat'])
        obs.lon = str(home['lon'])
        obs.date = datetime.utcnow().strftime("%Y/%m/%d %H:%M:%S")

        return obs.next_setting(ephem.Sun())

if __name__ == '__main__':
    sol = Solar()
    az_dt = sol.time_of_solar_azimuth_today(sol.home['solar_azimuth'])
    print 'Azimuth reached today at: ', az_dt

    sunset = sol.time_of_sunset_today()
    print 'Sunset today at: ', sunset
