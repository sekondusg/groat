class Config:
    def __init__(self):
        # For the house latitude and longitude, the magnetic declination is 15.52 degrees East
        # The normal vector from the sun facing side of the house is 17 degrees South of West.
        # The solar azimuth for exposure is then: (270 - (17 - 15.52)) - 90 ~= 179 degrees (relative to East of North)
        # For calculating magetic declination: http://www.ngdc.noaa.gov/geomag-web/#declination
        # Used the returned URL from Google maps for determining latitude and longitude
        self.home = {
            'solar_azimuth': 179, # Units in degrees measured from South and going clockwise
            'lat': 45.5205163,
            'lon': -122.7482624
        }

config = Config()
