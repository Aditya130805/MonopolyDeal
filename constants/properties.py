from game.card import PropertyCard

num_properties_needed_for_full_set = {
    "brown": 2, "mint": 2, "light blue": 3, "pink": 3, "orange": 3,
    "red": 3, "yellow": 3, "green": 3, "blue": 2, "black": 4
}

# Brown Properties
brown1 = PropertyCard("Mediterranean Avenue", "brown", 1)
brown2 = PropertyCard("Baltic Avenue", "brown", 1)

# Mint Properties
mint1 = PropertyCard("Water Works", "mint", 2)
mint2 = PropertyCard("Electric Company", "mint", 2)

# Light Blue Properties
light_blue1 = PropertyCard("Connecticut Avenue", "light blue", 1)
light_blue2 = PropertyCard("Vermont Avenue", "light blue", 1)
light_blue3 = PropertyCard("Oriental Avenue", "light blue", 1)

# Pink Properties
pink1 = PropertyCard("St. Charles Place", "pink", 2)
pink2 = PropertyCard("States Avenue", "pink", 2)
pink3 = PropertyCard("Virginia Avenue", "pink", 2)

# Orange Properties
orange1 = PropertyCard("Tennessee Avenue", "orange", 2)
orange2 = PropertyCard("New York Avenue", "orange", 2)
orange3 = PropertyCard("St. James Place", "orange", 2)

# Red Properties
red1 = PropertyCard("Illinois Avenue", "red", 3)
red2 = PropertyCard("Indiana Avenue", "red", 3)
red3 = PropertyCard("Kentucky Avenue", "red", 3)

# Yellow Properties
yellow1 = PropertyCard("Atlantic Avenue", "yellow", 3)
yellow2 = PropertyCard("Marvin Gardens", "yellow", 3)
yellow3 = PropertyCard("Ventnor Avenue", "yellow", 3)

# Green Properties
green1 = PropertyCard("Pacific Avenue", "green", 4)
green2 = PropertyCard("North Carolina Avenue", "green", 4)
green3 = PropertyCard("Pennsylvania Avenue", "green", 4)

# Blue Properties
blue1 = PropertyCard("Boardwalk", "blue", 4)
blue2 = PropertyCard("Park Place", "blue", 4)

# Black (Railroads) Properties
black1 = PropertyCard("Short Line", "black", 2)
black2 = PropertyCard("Pennsylvania Railroad", "black", 2)
black3 = PropertyCard("Reading Railroad", "black", 2)
black4 = PropertyCard("B. & O. Railroad", "black", 2)

# Wild Properties
wild_blue_green = PropertyCard("Wild Property", ['blue', 'green'], 4, True),
wild_red_yellow1 = PropertyCard("Wild Property", ['red', 'yellow'], 3, True),
wild_red_yellow2 = PropertyCard("Wild Property", ['red', 'yellow'], 3, True),
wild_pink_orange1 = PropertyCard("Wild Property", ['pink', 'orange'], 2, True),
wild_pink_orange2 = PropertyCard("Wild Property", ['pink', 'orange'], 2, True),
wild_black_mint = PropertyCard("Wild Property", ['black', 'mint'], 2, True),
wild_black_light_blue = PropertyCard("Wild Property", ['black', 'light blue'], 4, True),
wild_black_green = PropertyCard("Wild Property", ['black', 'green'], 4, True),
wild_brown_light_blue = PropertyCard("Wild Property", ['brown', 'light blue'], 1, True),
wild_multicolor1 = PropertyCard("Wild", ['brown', 'mint', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black'], None, True)
wild_multicolor2 = PropertyCard("Wild", ['brown', 'mint', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black'], None, True)
