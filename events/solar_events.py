from config import config
import ephem
import math

class Solar:
    def __init__(self):
        self.obs = ephem.Observer()
        home = config.home; self.home = home
        self.obs.lat = home['lat']
        self.obs.lon = home['lon']

    def time_of_solar_azimuth(self):
        sun = ephem.Sun()
        sun.compute(self.obs)

        def err_az(x):
            self.obs.date = x
            sun.compute(self.obs)
            err_delta = sun.az - (math.pi/180. * self.home['solar_azimuth'])
            #print('err: ', sun.az, ', solar_azimuth',  ephem.degrees(self.home['solar_azimuth']))
            print('az: ', sun.az, ', solar_azimuth',  self.home['solar_azimuth'], ', delta: ', err_delta)
            #return sun.az - ephem.degrees(self.home['solar_azimuth'])
            return err_delta

        self.obs.date = '2016/06/21 19:45:00'

        x = self.obs.date
        print 'Searching for the correct time...'
        ephem.newton(err_az, x, x + 0.01)
        print 'At the time and date: ', self.obs.date
        print 'the solar azimuth is', sun.az

if __name__ == '__main__':
    sol = Solar()
    sol.time_of_solar_azimuth()
