"use strict";

var ship_list = [
    {
        name: 'Adder',
        link: 'adder',
        hard_points: [ 'M', 'S', 'S' ],
        utilities: 2,
        calibration_gun: 3,
        missing_modules: ['fighter bay'],
        ingame_description: "A compact, adaptable ship, the Adder has a larger cargo hold than other ships of similar size, and its base jump range of over 30 light years makes it a viable choice for explorers. The ship can also hold its own in a dogfight, when properly outfitted.",
        info: ['S', 31.5, 28.8, 9.6, 2, 35, 7, 35, 'Zorgon Peterson']
    }, {
        name: 'Alliance Challenger',
        link: 'alliance-challenger',
        hard_points: [ 'L', 'M', 'M', 'M', 'S', 'S', 'S' ],
        utilities: 4,
        calibration_gun: 3,
        missing_modules: ['fighter bay'],
        ingame_description: "A modified version of the Alliance Chieftain, the Alliance Challenger has been envisaged as a frontline combat vessel. With a generous complement of hardpoints, the Challenger can more than hold its own in a fight, and although it weighs more than its sister ship, it has retained the Chieftain's characteristic agility. It also has stronger armour than the Chieftain, allowing it to soak up a significant amount of punishment.",
        info: ['M', 68.4, 48.4, 19.7, 2, 450, 13, 65, 'Lakon Spaceways']
    }, {
        name: 'Alliance Chieftain',
        link: 'alliance-chieftain',
        hard_points: [ 'L', 'L', 'M', 'S', 'S', 'S' ],
        utilities: 4,
        calibration_gun: 3,
        missing_modules: ['fighter bay'],
        ingame_description: "The Alliance Chieftain has been designed not only to dish out punishment, but to avoid it. Manufactured by Lakon Spaceways, the Chieftain is more manoeuvrable than ships of similar size and weight, and its combat profile means it can more than hold its own in a fight. The ship also boasts three internal military compartments, allowing the pilot to equip a shield cell bank, hull reinforcements and module reinforcements.<div class=\"es-notice\">The neutral position of gunsights seems to be set at 2 km distance instead of the usual 500 m value.</div>",
        info: ['M', 68.1, 58.5, 19.9, 2, 400, 13, 65, 'Lakon Spaceways']
    }, {
        name: 'Alliance Crusader',
        link: 'alliance-crusader',
        hard_points: [ 'L', 'M', 'M', 'S', 'S', 'S' ],
        utilities: 4,
        calibration_gun: 3,
        missing_modules: [],
        core: [6, 6, 5, 5, 6, 4, 4],
        internal: [6, 5, 14, 14, 14, 3, 3, 2, 2, 1],
        ingame_description: "A modified version of the Alliance Chieftain, the Alliance Crusader's main point of distinction is its fighter bay. The Crusader also offers three internal military compartments and space for up to two crew members, making it ideally suited to combat situations.",
        info: ['M', 68.1, 58.5, 19.8, 3, 500, 13, 65, 'Lakon Spaceways']
    }, {
        name: 'Anaconda',
        link: 'anaconda',
        hard_points: [ 'H', 'L', 'L', 'L', 'M', 'M', 'S', 'S' ],
        utilities: 8,
        calibration_gun: 2,
        missing_modules: [],
        core: [8, 7, 6, 5, 8, 8, 5],
        internal: [7, 6, 6, 6, 5, 5, 5, 15, 4, 4, 4, 2, 1],
        ingame_description: "The pride of Faulcon deLacy's shipyards. the Anaconda is a versatile ship that can carry large cargos and pack a heavy punch. So hardy is the Anaconda, some smaller navies use it in lieu of a frigate or light cruiser. The ship can also be upgraded with a docking bay.",
        info: ['L', 155.0, 62.0, 32.0, 3, 400, 23, 65, 'Faulcon deLacy']
    }, {
        name: 'Asp Explorer',
        link: 'asp-explorer',
        hard_points: [ 'M', 'M', 'S', 'S', 'S', 'S' ],
        utilities: 4,
        calibration_gun: 4,
        missing_modules: ['fighter bay'],
        ingame_description: "Manufactured by Lakon Spaceways, the Asp Explorer is often marketed at pilots seeking their first multi-crew vessel. Its high jump range and wide, unobstructed cockpit canopy make it popular with explorers, but its versatility also makes it a viable choice for traders and combat pilots.",
        info: ['M', 56.5, 51.3, 19.7, 2, 280, 11, 52, 'Lakon Spaceways']
    }, {
        name: 'Asp Scout',
        link: 'asp-scout',
        hard_points: [ 'M', 'M', 'S', 'S' ],
        utilities: 2,
        calibration_gun: 4,
        missing_modules: ['fighter bay'],
        ingame_description: "This versatile vessel uses the same frame as its sister ship the Asp Explorer, but is more manoeuvrable due to having less overall mass. The trade-off for this agility is a lower hardpoint capacity, which makes the Scout less suited to combat situations. But with the same jump range as the Explorer, the Scout still has something to offer the pioneer.",
        info: ['M', 54.8, 59.4, 17.0, 2, 150, 8, 52, 'Lakon Spaceways']
    }, {
        name: 'Beluga Liner',
        link: 'beluga-liner',
        hard_points: [ 'M', 'M', 'M', 'M', 'M' ],
        utilities: 6,
        calibration_gun: 1,
        calibration_distance: 150,
        missing_modules: [],
        core: [6, 7, 7, 8, 6, 5, 7],
        internal: [6, 6, 6, 6, 5, 5, 4, 3, 3, 3, 3, 1],
        ingame_description: "Manufactured by Saud Kruger, the Beluga Liner is a high-end passenger ship for those who value luxury and comfort. With the largest passenger capacity of any Saud Kruger vessel, and the ability to accommodate a luxury-tier passenger cabin, the Beluga is the only choice for those who want to travel in style.",
        info: ['L', 209.1, 31.6, 38.6, 3, 950, 18, 60, 'Saud Kruger']
    }, {
        name: 'Cobra Mk III',
        link: 'cobra-mk-iii',
        hard_points: [ 'M', 'M', 'S', 'S' ],
        utilities: 2,
        calibration_gun: 4,
        missing_modules: ['fighter bay'],
        ingame_description: "A true multipurpose ship, the Cobra Mk III can fit comfortably into a range of roles. In combat it can hit hard and&mdash;if necessary&mdash;make a swift exit, while its spacious cargo hold allows it to carry more than other ships of similar price and size. The Cobra is also a solid choice for explorers, boasting an ample fuel tank and six internal compartments.",
        info: ['S', 27.1, 44.0, 7.9, 2, 180, 8, 35, 'Faulcon deLacy']
    }, {
        name: 'Cobra Mk IV',
        link: 'cobra-mk-iv',
        hard_points: [ 'M', 'M', 'S', 'S', 'S' ],
        utilities: 2,
        calibration_gun: 2,
        missing_modules: ['fighter bay'],
        ingame_description: "The Cobra MkIV is Faulcon deLacy's development of the famous Cobra MkIII. It's a heavier and bulkier ship than the MkIII, but packs an extra punch and its better weaponry placement makes it a more effective combat vessel. It's tougher, to improve survivability, and allows better upgrading, but at the expense of some of its agility.",
        info: ['S', 33.1, 48.1, 8.6, 2, 210, 8, 35, 'Faulcon deLacy']
    }, {
        name: 'Diamondback Explorer',
        link: 'diamondback-explorer',
        hard_points: [ 'L', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "The Diamondback Explorer is a dual-role ship designed with both exploration and combat in mind. Sibling to the smaller Diamondback Scout, the Explorer's superior firepower and hardpoint array make it more flexible than its sister ship, while its long jump range and exceptional heat efficiency make it an excellent choice for explorers.",
        info: ['S', 45.0, 27.3, 13.6, 1, 260, 10, 42, 'Lakon Spaceways']
    }, {
        name: 'Diamondback Scout',
        link: 'diamondback-scout',
        hard_points: [ 'M', 'M', 'S', 'S' ],
        utilities: 4,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "Developed by Lakon Spaceways, the Diamondback Scout is a dual-purpose combat and exploration ship. Its 30 light-year jump range makes it popular with aspiring explorers, while its exceptional manoeuvrability makes it excellent at evading incoming fire. And with two medium and two small hardpoints, the Scout can also pack a punch.",
        info: ['S', 39.0, 24.3, 12.3, 1, 170, 8, 40, 'Lakon Spaceways']
    }, {
        name: 'Dolphin',
        link: 'dolphin',
        hard_points: [ 'S', 'S' ],
        utilities: 3,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "Like Saud Kruger's other passenger vessels, the Dolphin can accommodate a luxury-tier passenger cabin, allowing it to transport passengers in comfort. And despite costing significantly less than its sister ships, the Beluga Liner and the Orca, the Dolphin boasts the same sleek lines and refined aesthetic.",
        info: ['S', 51.8, 20.8, 8.8, 1, 140, 9, 35, 'Saud Kruger']
    }, {
        name: 'Eagle',
        link: 'eagle',
        hard_points: [ 'S', 'S', 'S' ],
        utilities: 1,
        calibration_gun: 2,
        missing_modules: ['fighter bay'],
        ingame_description: "Developed by Core Dynamics, the Eagle is a compact combat ship with peerless manoeuvrability. For many independent pilots it represents a natural progression from the Sidewinder, boasting superior cargo capacity and combat ability in addition to a better hardpoint array. These features are offset by a comparatively short jump range, however.",
        info: ['S', 31.2, 29.7, 7.1, 1, 50, 6, 28, 'Core Dynamics']
    }, {
        name: 'Federal Assault Ship',
        link: 'federal-assault-ship',
        hard_points: [ 'L', 'L', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "Based on the Federal Dropship, the Federal Assault Ship sacrifices the flexibility of its sibling in favour of a more combat-oriented profile. Faster and more manoeuvrable than the Dropship, and boasting two medium and two large hardpoints, this is a vessel that has been designed to strike fast and hard. The trade-off for this power and agility is a reduction in internal compartments, making the Assault Ship less versatile than the Dropship.",
        info: ['M', 73.8, 49.5, 22.8, 2, 480, 14, 60, 'Core Dynamics']
    }, {
        name: 'Federal Corvette',
        link: 'federal-corvette',
        hard_points: [ 'H', 'H', 'L', 'M', 'M', 'S', 'S' ],
        utilities: 8,
        calibration_gun: 4,
        missing_modules: [],
        core: [8, 7, 6, 5, 8, 8, 5],
        internal: [7, 7, 7, 6, 6, 5, 5, 15, 15, 4, 4, 3, 1],
        ingame_description: "The Federal Corvette is one of the most powerful combat ships on the market. With a total of seven hardpoints, the ship has few rivals in terms of damage output, and is remarkably manoeuvrable given its size. Despite its comparatively small jump range, owning a Corvette is the ultimate ambition of many independent combat pilots, its astonishing power making it one of the most formidable vessels in the galaxy.",
        info: ['L', 167.8, 87.2, 28.3, 3, 900, 24, 70, 'Core Dynamics']
    }, {
        name: 'Federal Dropship',
        link: 'federal-dropship',
        hard_points: [ 'L', 'M', 'M', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 4,
        missing_modules: ['fighter bay'],
        ingame_description: "Developed by Core Dynamics, the Federal Dropship is a versatile combat vessel widely used by the Federal Navy. Boasting one large and four medium hardpoints, the vessel can contend even with larger ships such as the Python, while its two military compartments allow the pilot to enhance the ship's defensive profile.",
        info: ['M', 73.9, 52.3, 21.7, 2, 580, 14, 60, 'Core Dynamics']
    }, {
        name: 'Federal Gunship',
        link: 'federal-gunship',
        hard_points: [ 'L', 'M', 'M', 'M', 'M', 'S', 'S' ],
        utilities: 4,
        calibration_gun: 4,
        missing_modules: [],
        core: [6, 6, 5, 5, 7, 5, 4],
        internal: [6, 6, 5, 14, 14, 14, 2, 2, 1],
        ingame_description: "The Federal Gunship is a tougher, more powerful version of its sibling, the Federal Dropship. With a total of seven hardpoints, the Gunship boasts a stronger combat profile than the Dropship, while its superior armour allows it to soak up more punishment. It may be slower and less agile than the Dropship, but this is by design&mdash;the Gunship has been created to dominate other ships, rather than outpace or outmanoeuvre them.",
        info: ['M', 75.5, 53.3, 22.5, 2, 580, 14, 60, 'Core Dynamics']
    }, {
        name: 'Fer-de-Lance',
        link: 'fer-de-lance',
        hard_points: [ 'H', 'M', 'M', 'M', 'M' ],
        utilities: 6,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "The Fer-de-Lance is a heavy combat ship manufactured by Zorgon Peterson. With four medium and one huge hardpoint, the ship is a veritable powerhouse, able to mount a challenge even to the Anaconda and Federal Corvette. If the vessel has a drawback it is that it is highly speciailised&mdash;consumers are advised that the Fer-de-Lance is unsuited to activities other than combat.",
        info: ['M', 73.6, 51.6, 15.4, 2, 250, 12, 70, 'Zorgon Peterson']
    }, {
        name: 'Hauler',
        link: 'hauler',
        hard_points: [ 'S' ],
        utilities: 2,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "The galaxy is full of successful traders who started their career with a Hauler. The ship's comparatively low cost and significant carrying capacity have made it the most popular small cargo ship in human space. The Hauler is highly specialised, however, and consumers are advised that it is unsuited to activities other than trade.",
        info: ['S', 28.6, 26.2, 10.4, 1, 14, 6, 20, 'Zorgon Peterson']
    }, {
        name: 'Imperial Clipper',
        link: 'imperial-clipper',
        hard_points: [ 'L', 'L', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 3,
        missing_modules: ['fighter bay'],
        ingame_description: "The very definition of a multipurpose ship, the Imperial Clipper is a versatile vessel well suited to a variety of roles. A generous quantity of internal compartments has made it very popular with miners, while a sizeable cargo hold and robust defences have endeared the vessel to traders. Impressive straight-line speed rounds out the ship's profile, and makes it one of the most distinguished members of the Gutamaya family.",
        info: ['L', 106.7, 103.7, 24.8, 2, 400, 12, 60, 'Gutamaya']
    }, {
        name: 'Imperial Courier',
        link: 'imperial-courier',
        hard_points: [ 'M', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "One of the most compact vessels on the market, the Imperial Courier is a lightweight combat ship from Gutamaya. With agility to rival the Viper Mk III, the Courier is adept at evading incoming fire, while its three medium hardpoints have made it popular with those who want a balance of power and style.",
        info: ['S', 42.1, 27.4, 7.1, 1, 35, 7, 30, 'Gutamaya']
    }, {
        name: 'Imperial Cutter',
        link: 'imperial-cutter',
        hard_points: [ 'H', 'L', 'L', 'M', 'M', 'M', 'M' ],
        utilities: 8,
        calibration_gun: 2,
        missing_modules: [],
        core: [8, 8, 7, 7, 7, 7, 6],
        internal: [8, 8, 6, 6, 6, 5, 5, 15, 15, 4, 3, 1],
        ingame_description: "The pride of Gutamaya's shipyards, the Imperial Cutter is a formidable all-rounder. With sufficient armour and shielding to withstand all but the most determined attacks, and a total of seven hardpoints, the Cutter boasts an intimidating combat profile, while its substantial cargo hold makes It a solid choice for traders.",
        info: ['L', 192.6, 111.1, 33.4, 3, 1100, 26, 70, 'Gutamaya']
    }, {
        name: 'Imperial Eagle',
        link: 'imperial-eagle',
        hard_points: [ 'M', 'S', 'S' ],
        utilities: 1,
        calibration_gun: 2,
        missing_modules: ['fighter bay'],
        ingame_description: "Based on Core Dynamics’ Eagle, Gutamaya's Imperial Eagle places greater emphasis on speed and combat than its predecessor. The ship's armour and shields have been enhanced, and one of the small hardpoints of the original has been replaced with a medium hardpoint. Naturally, these features have made the ship heavier and less manoeuvrable than its predecessor, but the Imperial Eagle remains a solid choice for those seeking a high-speed attack ship.",
        info: ['S', 31.2, 34.7, 7.1, 1, 50, 6, 28, 'Gutamaya']
    }, {
        name: 'Keelback',
        link: 'keelback',
        hard_points: [ 'M', 'M', 'S', 'S' ],
        utilities: 3,
        calibration_gun: 3,
        missing_modules: [],
        core: [4, 4, 4, 1, 3, 2, 4],
        internal: [5, 5, 4, 3, 2, 2, 1],
        ingame_description: "Based on the Type-6 Transporter, the Keelback is a hardy freighter designed for hostile-environment deliveries. The small hardpoints of the Type-6 have been bolstered with two medium hardpoints, but it is the Keelback’s ability to accommodate a fighter bay that really sets it apart. The ship also boasts superior armour and shields to the Type-6, making it a good option for traders who plan to travel without an escort.",
        info: ['M', 49.7, 40.3, 14.9, 1, 180, 8, 45, 'Lakon Spaceways']
    }, {
        name: 'Krait Mk II',
        link: 'krait-mk-ii',
        hard_points: [ 'L', 'L', 'L', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 2,
        missing_modules: [],
        core: [7, 6, 5, 4, 7, 6, 5],
        internal: [6, 6, 5, 5, 4, 3, 3, 2, 1],
        ingame_description: "The Krait MkII is a reimagining of the Krait Lightspeeder, which was originally manufactured by Faulcon deLacy in the 3100s. Although the new ship is larger than the original, it possesses many of the same characteristics, emphasizing speed, manoeuvrability and firepower over defensive capability. The ship also boasts a fighter bay and space for up to two crew members, making it a good option for those seeking a medium-weight, multipurpose vessel.",
        info: ['M', 73.3, 72.0, 13.5, 3, 320, 17, 55, 'Faulcon deLacy']
    }, {
        name: 'Krait Phantom',
        link: 'krait-phantom',
        hard_points: [ 'L', 'L', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "With a spacious cargo hold and a relatively generous quantity of hardpoints, the Krait Phantom is a versatile ship suited to a range of roles. It has enough firepower to hold its own against larger targets, and enough straight-line speed to outpace smaller targets. The ship also offers eight internal compartments, allowing the pilot to tailor the ship to their requirements. And while it lacks the firepower and fighter bay of its sister ship, the Krait Mk II, it is both faster and lighter.",
        info: ['M', 73.3, 72.0, 14.6, 2, 270, 17, 55, 'Faulcon deLacy']
    }, {
        name: 'Mamba',
        link: 'mamba',
        hard_points: [ 'H', 'L', 'L', 'S', 'S' ],
        utilities: 6,
        calibration_gun: 2,
        missing_modules: ['fighter bay'],
        ingame_description: "Based on an unreleased racing prototype, the Mamba is one of the fastest ships in production. It can also deliver a lot of punishment, boasting one huge and two large hardpoints. This emphasis on firepower and speed means the ship can hit hard and fast, vanishing before the target has a chance to react. Comparisons to the Fer-de-Lance, also produced by Zorgon Peterson, will be inevitable, but the Mamba is in fact faster in a straight line, while being slightly less maneuverable.",
        info: ['M', 72.2, 50.1, 11.4, 2, 250, 12, 70, 'Zorgon Peterson']
    }, {
        name: 'Orca',
        link: 'orca',
        hard_points: [ 'L', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "The Orca is a high-end passenger ship manufactured by Saud Kruger, the market leader in civilian-transport vessels. Like Saud Kruger's other ships, the Orca can accommodate a luxury-tier passenger cabin, allowing it to transport passengers in comfort and style. The Orca has not been designed for combat or exploration, however, and its internal compartments cannot accommodate military modules.",
        info: ['L', 130.4, 50.8, 22.7, 2, 290, 13, 55, 'Saud Kruger']
    }, {
        name: 'Python',
        link: 'python',
        hard_points: [ 'L', 'L', 'L', 'M', 'M' ],
        utilities: 4,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "Manufactured by Faulcon deLacy, the Python is a multipurpose ship that offers an enticing balance of manoeuvrability, firepower and defence. With five hardpoints, it can go head-to-head with large ships such as the Anaconda and Imperial Cutter, while its agility allows it to handle smaller vessels without having to rely on turret weapons. The Python also has a sizeable cargo hold, making it a viable choice for those seeking a combat-capable freighter.",
        info: ['M', 87.9, 58.1, 18.0, 2, 350, 17, 65, 'Faulcon deLacy']
    }, {
        name: 'Sidewinder',
        link: 'sidewinder',
        hard_points: [ 'S', 'S' ],
        utilities: 2,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "The Sidewinder is a multipurpose ship manufactured by Faulcon deLacy. Its versatility and comparatively low price point have made it popular with novice pilots, but the Sidewinder's reputation as an entry-level vessel should not be seen as a sign of inferiority&mdash;it is one of the most manoeuvrable ships on the market.",
        info: ['S', 14.9, 21.3, 5.4, 1, 25, 6, 20, 'Faulcon deLacy']
    }, {
        name: 'Type-6 Transporter',
        link: 'type-6-transporter',
        hard_points: [ 'S', 'S' ],
        utilities: 3,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "Manufactured by Lakon Spaceways, the Type-6 Transporter is seen by many independent pilots as a natural progression from the versatile Cobra Mk III. When appropriately outfitted, the ship offers sufficient cargo space for the profitable trading of standard commodities, precluding the need to transport rare commodities long distances. The Type-6 has limited combat ability, however, and pilots who expect conflict are advised to upgrade the ship's shields and hull.",
        info: ['M', 48.4, 27.2, 15.0, 1, 155, 8, 35, 'Lakon Spaceways']
    }, {
        name: 'Type-7 Transporter',
        link: 'type-7-transporter',
        hard_points: [ 'S', 'S', 'S', 'S' ],
        utilities: 4,
        calibration_gun: 4,
        missing_modules: ['fighter bay'],
        ingame_description: "The Type-7 Transporter is a freighter that occupies a position between the smaller Type-6 Transporter and the larger Type-9 Heavy. The ship's notable jump range and comparatively low price point range make it a good option for aspiring traders.",
        info: ['L', 81.6, 56.1, 25.4, 1, 350, 10, 54, 'Lakon Spaceways']
    }, {
        name: 'Type-9 Heavy',
        link: 'type-9-heavy',
        hard_points: [ 'M', 'M', 'M', 'S', 'S' ],
        utilities: 4,
        calibration_gun: 4,
        missing_modules: [],
        core: [6, 7, 6, 5, 6, 4, 6],
        internal: [8, 8, 7, 6, 5, 4, 4, 3, 3, 2, 1],
        ingame_description: "The Type-9 Heavy is one of the largest cargo ships on the market. While it lacks the carrying capacity of the Imperial Cutter, it is significantly less expensive and can be purchased without acquiring ranks in the Imperial Navy. Furthermore, the ship's ability to equip a fighter bay makes It popular with traders looking to protect their cargoes from criminals.",
        info: ['L', 117.4, 115.3, 33.2, 3, 850, 16, 65, 'Lakon Spaceways']
    }, {
        name: 'Type-10 Defender',
        link: 'type-10-defender',
        hard_points: [ 'L', 'L', 'L', 'L', 'M', 'M', 'M', 'S', 'S' ],
        utilities: 8,
        calibration_gun: 8,
        missing_modules: [],
        core: [8, 7, 7, 5, 7, 4, 6],
        internal: [8, 7, 6, 5, 15, 15, 4, 4, 3, 3, 2, 1],
        ingame_description: "The Alliance commissioned Lakon Spaceways to produce the versatile Type-10 Defender, which represents a comprehensive revision of the Type-9 Heavy. Boasting greater speed, acceleration and manoeuvrability than the Type-9 and a more focused hardpoint layout. It was envisaged principally as a combat vessel, but its sizeable cargo hold makes it equally useful to traders.",
        info: ['L', 135.1, 118.4, 39.3, 3, 1200, 26, 75, 'Lakon Spaceways']
    }, {
        name: 'Viper Mk III',
        link: 'viper-mk-iii',
        hard_points: [ 'M', 'M', 'S', 'S' ],
        utilities: 2,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "The Viper Mk III is a light combat ship manufactured by Faulcon deLacy. Fast and manoeuvrable, the Viper's comparatively low price point makes it a good option for aspiring bounty hunters, while its versatility has made it popular with security forces throughout the galaxy.",
        info: ['S', 29.8, 24.0, 8.6, 1, 50, 7, 35, 'Faulcon deLacy']
    }, {
        name: 'Viper Mk IV',
        link: 'viper-mk-iv',
        hard_points: [ 'M', 'M', 'S', 'S' ],
        utilities: 2,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "The Viper Mk IV is a heavy combat ship manufactured by Faulcon deLacy. Its ability to equip a class-4 power plant makes it ideally suited to long-range combat missions, while its armour allows it to soak up much more punishment than its predecessor, the Viper Mk III. These features come at a cost, however, making the Mk IV heavier and less agile than the Mk III.",
        info: ['S', 29.9, 24.7, 8.7, 1, 190, 7, 35, 'Faulcon deLacy']
    }, {
        name: 'Vulture',
        link: 'vulture',
        hard_points: [ 'L', 'L' ],
        utilities: 4,
        calibration_gun: 1,
        missing_modules: ['fighter bay'],
        ingame_description: "Core Dynamics pushed its expertise to the limit when creating the Vulture, employing sophisticated techniques to integrate two large hardpoints into the ship's compact frame. The manufacturer also graced the Vulture with powerful lateral thrusters, allowing it to evade incoming fire while dealing significant damage, and making it particularly deadly in combat.",
        info: ['S', 43.1, 34.7, 12.3, 2, 230, 10, 55, 'Core Dynamics']
    }
];

var fighter_list = [
    {
        name: 'F63 Condor',
        link: 'slf-f63-condor',
        hard_points: [ 'FS', 'FS' ],
        utilities: 1,
        calibration_gun: 1,
        missing_modules: ['fighter bay', 'landing gear', 'cargo hatch'],
        core: [1, 1, 0, 0, 1, 1, 0],
        internal: [1],
        ingame_description: "The F63 Condor is a short-range fighter. Offering a balance of speed, resilience and firepower, it is a solid all-rounder.<div class=\"es-variants\"><span><b>Aegis F</b>: fixed plasma repeaters, point defence;</span><span><b>Rogue F</b>: fixed multi-cannons, chaff;</span><span><b>Gelid G</b>: gimballed beam lasers, heatsink;</span><span><b>Rogue G</b>: gimballed pulse lasers, chaff;</span><span><b>Gelid F</b>: fixed pulse lasers, heatsink.</div>",
        info: ['Fighter Hangar', 13.5, 10.5, 2.5, 1, 'N/A', 'N/A', 'N/A', 'Core Dynamics', 25, 25]
    }, {
        name: 'Gu-97',
        link: 'slf-gu-97',
        hard_points: [ 'FS', 'FS' ],
        utilities: 1,
        calibration_gun: 1,
        missing_modules: ['fighter bay', 'landing gear', 'cargo hatch'],
        core: [1, 1, 0, 0, 1, 1, 0],
        internal: [1],
        ingame_description: "The Gu-97 is a short-range fighter. It may lack the defensive capabilities of the Taipan and F63 Condor, but it is considerably faster and more manoeuvrable.<div class=\"es-variants\"><span><b>Aegis F</b>: fixed pulse lasers, point defence;</span><span><b>Rogue F</b>: fixed plasma repeaters, chaff;</span><span><b>Gelid G</b>: gimballed beam lasers, heatsink;</span><span><b>Rogue G</b>: gimballed pulse lasers, chaff;</span><span><b>Gelid F</b>: fixed beam lasers, heatsink.</div>",
        info: ['Fighter Hangar', 6.5, 14.9, 2.2, 1, 'N/A', 'N/A', 'N/A', 'Gutamaya', 15, 15]
    }, {
        name: 'Taipan',
        link: 'slf-taipan',
        hard_points: [ 'FS', 'FS' ],
        utilities: 1,
        calibration_gun: 1,
        missing_modules: ['fighter bay', 'landing gear', 'cargo hatch'],
        core: [1, 1, 0, 0, 1, 1, 0],
        internal: [1],
        ingame_description: "The Taipan is a hardy fighter that compensates for a lack of speed with considerable durability, allowing it to withstand far greater punishment than other fighters.<div class=\"es-variants\"><span><b>Aegis F</b>: fixed pulse lasers, point defence;</span><span><b>AX1 F</b>: AX multi-cannons;</span><span><b>Rogue F</b>: fixed plasma repeaters, chaff;</span><span><b>Gelid G</b>: gimballed beam lasers, heatsink;</span><span><b>Rogue G</b>: gimballed pulse lasers, chaff;</span><span><b>Gelid F</b>: fixed beam lasers, heatsink.</div>",
        info: ['Fighter Hangar', 13.9, 16.9, 2.6, 1, 'N/A', 'N/A', 'N/A', 'Faulcon deLacy', 45, 30]
    }, {
        name: 'XG7 Trident',
        link: 'slf-xg7-trident',
        hard_points: [ 'FS' ],
        utilities: 0,
        calibration_gun: 1,
        missing_modules: ['fighter bay', 'landing gear', 'cargo hatch', 'heat vents'],
        core: [1, 1, 0, 0, 1, 1, 0],
        internal: [1],
        ingame_description: "The Trident is the first commercially viable fighter to emerge from an engineering project combining human and Guardian technology. Having superseded a number of earlier, unsuccessful models, the Trident is both agile and fast, surpassed only by the F63 Condor in terms of speed, and second only to the Gu-97 Imperial Fighter in terms of manoeuvrability. The fighter has a relatively light hull, however, so once its shields are down it is comparatively vulnerable. This model is equipped with an integrated rapid-fire plasma weapon.",
        info: ['Fighter Hangar', 8.6, 19.8, 17.2, 1, 'N/A', 'N/A', 'N/A', 'Ram Tah', 10, 30]
    }, {
        name: 'XG8 Javelin',
        link: 'slf-xg8-javelin',
        hard_points: [ 'FS' ],
        utilities: 0,
        calibration_gun: 1,
        missing_modules: ['fighter bay', 'landing gear', 'cargo hatch', 'heat vents'],
        core: [1, 1, 0, 0, 1, 1, 0],
        internal: [1],
        ingame_description: "The Javelin fighter emerged from an innovative engineering project combining human and Guardian technology. Like its predecessor the Trident, the Javelin is fast and responsible, but also relatively fragile due to its light hull. This model is equipped with an integrated shard weapon.",
        info: ['Fighter Hangar', 13.5, 14.2, 12.9, 1, 'N/A', 'N/A', 'N/A', 'Ram Tah', 10, 30]
    }, {
        name: 'XG9 Lance',
        link: 'slf-xg9-lance',
        hard_points: [ 'FS' ],
        utilities: 0,
        calibration_gun: 1,
        missing_modules: ['fighter bay', 'landing gear', 'cargo hatch', 'heat vents'],
        core: [1, 1, 0, 0, 1, 1, 0],
        internal: [1],
        ingame_description: "The Lance is a direct successor to the Javelin, and like its predecessor it represents a fusion of human and Guardian technology. The fighter is both agile and fast, but it has a relatively light hull, so once its shields are down it is comparatively vulnerable. This model is equipped with an integrated gauss weapon.",
        info: ['Fighter Hangar', 15.3, 12.2, 11.2, 1, 'N/A', 'N/A', 'N/A', 'Ram Tah', 10, 30]
    }
];
