from game.card import PropertyCard

num_properties_needed_for_full_set = {
    "brown": 2, "mint": 2, "light blue": 3, "pink": 3, "orange": 3,
    "red": 3, "yellow": 3, "green": 3, "blue": 2, "black": 4
}

# Brown Properties
brown1 = PropertyCard("Mediterranean Avenue", "Brown", 1)
brown2 = PropertyCard("Baltic Avenue", "Brown", 1)

# Mint Properties
mint1 = PropertyCard("Water Works", "Mint", 2)
mint2 = PropertyCard("Electric Company", "Mint", 2)

# Light Blue Properties
light_blue1 = PropertyCard("Connecticut Avenue", "Light Blue", 1)
light_blue2 = PropertyCard("Vermont Avenue", "Light Blue", 1)
light_blue3 = PropertyCard("Oriental Avenue", "Light Blue", 1)

# Pink Properties
pink1 = PropertyCard("St. Charles Place", "Pink", 2)
pink2 = PropertyCard("States Avenue", "Pink", 2)
pink3 = PropertyCard("Virginia Avenue", "Pink", 2)

# Orange Properties
orange1 = PropertyCard("Tennessee Avenue", "Orange", 2)
orange2 = PropertyCard("New York Avenue", "Orange", 2)
orange3 = PropertyCard("St. James Place", "Orange", 2)

# Red Properties
red1 = PropertyCard("Illinois Avenue", "Red", 3)
red2 = PropertyCard("Indiana Avenue", "Red", 3)
red3 = PropertyCard("Kentucky Avenue", "Red", 3)

# Yellow Properties
yellow1 = PropertyCard("Atlantic Avenue", "Yellow", 3)
yellow2 = PropertyCard("Marvin Gardens", "Yellow", 3)
yellow3 = PropertyCard("Ventnor Avenue", "Yellow", 3)

# Green Properties
green1 = PropertyCard("Pacific Avenue", "Green", 4)
green2 = PropertyCard("North Carolina Avenue", "Green", 4)
green3 = PropertyCard("Pennsylvania Avenue", "Green", 4)

# Blue Properties
blue1 = PropertyCard("Boardwalk", "Blue", 4)
blue2 = PropertyCard("Park Place", "Blue", 4)

# Black (Railroads) Properties
black1 = PropertyCard("Short Line", "Black", 2)
black2 = PropertyCard("Pennsylvania Railroad", "Black", 2)
black3 = PropertyCard("Reading Railroad", "Black", 2)
black4 = PropertyCard("B. & O. Railroad", "Black", 2)

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
