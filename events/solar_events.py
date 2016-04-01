#!/usr/bin/env python

from config import config
import ephem
import math
from datetime import datetime
import subprocess

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
        dt = datetime.strptime(str(self.obs.date), '%Y/%m/%d %H:%M:%S')
        return(dt)

    def time_of_sunset_today(self):
        #sun = ephem.Sun()
        #sun.compute(self.obs)
        obs = ephem.Observer()
        home = config.home
        obs.lat = str(home['lat'])
        obs.lon = str(home['lon'])
        obs.date = datetime.utcnow().strftime("%Y/%m/%d 09:00:00") # Hack with local timezone to have sunset for anytime 'today'
        dt = datetime.strptime(str(obs.next_setting(ephem.Sun())), '%Y/%m/%d %H:%M:%S') 
        return dt

    def get_current_weather(self):
        cmd="curl -silent 'https://api.wunderground.com/weatherstation/WXDailyHistory.asp?ID=KORPORTL291&format=XML' | egrep '(temp_c|solar_radiation)' | tail -2 | sed 's/<\/.*//' | sed 's/^.*>//'"
        p = subprocess.Popen(['sh', '-c', cmd], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = p.communicate()
        out = out.splitlines()
        result = {
            'temp': out[0],
            'solar_radiation': out[1]
        }
        return result

    def get_solar_intensity(self):
        cmd="curl -silent 'https://api.wunderground.com/weatherstation/WXDailyHistory.asp?ID=KORPORTL422&format=XML' | egrep '(temp_c|solar_radiation)' | tail -2 | sed 's/<\/.*//' | sed 's/^.*>//'"        
        p = subprocess.Popen(['sh', '-c', cmd], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = p.communicate()
        temp, solar_radiation = out.splitlines()

        self.obs.lat = str(self.home['lat'])
        self.obs.lon = str(self.home['lon'])
        self.obs.date = datetime.utcnow().strftime("%Y/%m/%d %H:%M:%S")
        #self.obs.date = datetime.utcnow().strftime("2016/03/29 18:00:00")
        sun = ephem.Sun()
        sun.compute(self.obs)
        alt = float(sun.alt)
        alt = alt if alt > 0.01 else 0.01
        intensity = float(solar_radiation) / math.sin(alt)
        print 'solar_events(): alt:', str(alt), ',rad:', solar_radiation, ',intensity:', str(intensity)
        return({'intensity': intensity, 'temp': temp})

    def is_warm_n_sunny(self):
        now = datetime.utcnow()
        az_dt = self.time_of_solar_azimuth_today(sol.home['solar_azimuth'])
        sunset = self.time_of_sunset_today()
        print 'solar_events(): now:', str(now), 'sunset:', str(sunset), 'az_dt:', az_dt
        if now < sunset and now > az_dt:
            conditions = self.get_solar_intensity()
            #conditions = sol.get_current_weather()
            print "solar_events() Sun could be shining on the windows, conditions:", str(conditions)
            if float(conditions['intensity']) > 600.0:
                print "solar_events(): it is sunny"
                if float(conditions['temp']) > 15.0:
                    print "solar_events() it is warm and sunny"
                    return True
        else:
            print "solar_events() Sun is not shining through windows"
        return False
        
        
if __name__ == '__main__':
    sol = Solar()
    '''
    az_dt = sol.time_of_solar_azimuth_today(sol.home['solar_azimuth'])
    print 'Azimuth reached today at: ', az_dt

    sunset = sol.time_of_sunset_today()
    print 'Sunset today at: ', sunset

    conditions = sol.get_current_weather()
    print 'Weather:', str(conditions)
    '''
    close_blinds = sol.is_warm_n_sunny()
    if close_blinds == True:
        exit(0)

    exit(1)
    sol.get_solar_intensity()
