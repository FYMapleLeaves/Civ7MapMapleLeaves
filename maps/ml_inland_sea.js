// ml_inland_sea.ts
/**
 * Base game map script - Produces widely varied continents with a inland sea.
 * @packageDocumentation
 */
console.log("Generating using script ml_inland_sea.ts");
import { assignStartPositions, chooseStartSectors } from '/base-standard/maps/assign-starting-plots.js';
import { addMountains, addHills, expandCoasts, buildRainfallMap, generateLakes } from '/base-standard/maps/elevation-terrain-generator.js';
import { addFeatures, designateBiomes } from '/base-standard/maps/feature-biome-generator.js';
import * as globals from '/base-standard/maps/map-globals.js';
import * as utilities from '/base-standard/maps/map-utilities.js';
import { addNaturalWonders } from '/base-standard/maps/natural-wonder-generator.js';
import { generateResources } from '/base-standard/maps/resource-generator.js';
import { addVolcanoes } from '/base-standard/maps/volcano-generator.js';
import { assignAdvancedStartRegions } from '/base-standard/maps/assign-advanced-start-region.js';
import { generateDiscoveries } from '/base-standard/maps/discovery-generator.js';
import { generateSnow, dumpPermanentSnow } from '/base-standard/maps/snow-generator.js';
import { dumpStartSectors, dumpContinents, dumpTerrain, dumpElevation, dumpRainfall, dumpBiomes, dumpFeatures, dumpResources, dumpNoisePredicate } from '/base-standard/maps/map-debug-helpers.js';
function requestMapData(initParams) {
    console.log(initParams.width);
    console.log(initParams.height);
    console.log(initParams.topLatitude);
    console.log(initParams.bottomLatitude);
    console.log(initParams.wrapX);
    console.log(initParams.wrapY);
    console.log(initParams.mapSize);
    engine.call("SetMapInitData", initParams);
}
function generateMap() {
    console.log("Generating a map!");
    console.log(`Age - ${GameInfo.Ages.lookup(Game.age).AgeType}`);

    console.log("Maple_leaves' Map Optimizations!");

    let iWidth = GameplayMap.getGridWidth();
    let iHeight = GameplayMap.getGridHeight();
    let uiMapSize = GameplayMap.getMapSize();
    let startPositions = [];
    let mapInfo = GameInfo.Maps.lookup(uiMapSize);
    if (mapInfo == null)
        return;
    // Establish continent boundaries
    let iOceanWaterColumns = globals.g_OceanWaterColumns;
    let westContinent = {
        west: iOceanWaterColumns / 2,
        east: (iWidth / 2) - (iOceanWaterColumns / 2),
        south: globals.g_PolarWaterRows,
        north: iHeight - globals.g_PolarWaterRows,
        continent: 0
    };
    let eastContinent = {
        west: (iWidth / 2) + (iOceanWaterColumns / 2),
        east: iWidth - (iOceanWaterColumns / 2),
        south: globals.g_PolarWaterRows,
        north: iHeight - globals.g_PolarWaterRows,
        continent: 0
    };
    let startSectors;
    let iNumPlayers1 = mapInfo.PlayersLandmass1;
    let iNumPlayers2 = mapInfo.PlayersLandmass2;
    let iNumNaturalWonders = mapInfo.NumNaturalWonders;
    let iTilesPerLake = mapInfo.LakeGenerationFrequency;
    let iStartSectorRows = mapInfo.StartSectorRows;
    let iStartSectorCols = mapInfo.StartSectorCols;
    let iRandom = TerrainBuilder.getRandomNumber(2, "East or West");
    if (iRandom == 1) {
        let iNum1 = iNumPlayers1;
        let iNum2 = iNumPlayers2;
        iNumPlayers1 = iNum2;
        iNumPlayers2 = iNum1;
    }
    let bHumanNearEquator = utilities.needHumanNearEquator();
    startSectors = chooseStartSectors(iNumPlayers1, iNumPlayers2, iStartSectorRows, iStartSectorCols, bHumanNearEquator);
    createLandmasses(iWidth, iHeight, westContinent, eastContinent, iStartSectorRows, iStartSectorCols, startSectors);
    TerrainBuilder.validateAndFixTerrain();
    expandCoasts(iWidth, iHeight);
    utilities.adjustOceanPlotTags(iNumPlayers1 > iNumPlayers2);
    AreaBuilder.recalculateAreas();
    TerrainBuilder.stampContinents();
    addMountains(iWidth, iHeight);
    addVolcanoes(iWidth, iHeight);
    generateLakes(iWidth, iHeight, iTilesPerLake);
    AreaBuilder.recalculateAreas();
    TerrainBuilder.buildElevation();
    addHills(iWidth, iHeight);
    buildRainfallMap(iWidth, iHeight);
    TerrainBuilder.modelRivers(5, 15, globals.g_NavigableRiverTerrain);
    TerrainBuilder.validateAndFixTerrain();
    TerrainBuilder.defineNamedRivers();
    designateBiomes(iWidth, iHeight);
    addNaturalWonders(iWidth, iHeight, iNumNaturalWonders);
    TerrainBuilder.addFloodplains(4, 10);
    addFeatures(iWidth, iHeight);
    TerrainBuilder.validateAndFixTerrain();
    AreaBuilder.recalculateAreas();
    TerrainBuilder.storeWaterData();
    generateSnow(iWidth, iHeight);
    dumpStartSectors(startSectors);
    dumpContinents(iWidth, iHeight);
    dumpTerrain(iWidth, iHeight);
    dumpElevation(iWidth, iHeight);
    dumpRainfall(iWidth, iHeight);
    dumpBiomes(iWidth, iHeight);
    dumpFeatures(iWidth, iHeight);
    dumpPermanentSnow(iWidth, iHeight);
    generateResources(iWidth, iHeight, westContinent, eastContinent, iNumPlayers1, iNumPlayers2);
    startPositions = assignStartPositions(iNumPlayers1, iNumPlayers2, westContinent, eastContinent, iStartSectorRows, iStartSectorCols, startSectors);
    generateDiscoveries(iWidth, iHeight, startPositions);
    dumpResources(iWidth, iHeight);
    FertilityBuilder.recalculate(); // Must be after features are added.
    let seed = GameplayMap.getRandomSeed(); // can use any seed you want for different noises
    let avgDistanceBetweenPoints = 3;
    let normalizedRangeSmoothing = 2;
    let poisson = TerrainBuilder.generatePoissonMap(seed, avgDistanceBetweenPoints, normalizedRangeSmoothing);
    let poissonPred = (val) => {
        return val >= 1 ? "*" : " ";
    };
    dumpNoisePredicate(iWidth, iHeight, poisson, poissonPred);
    assignAdvancedStartRegions();
}
// Register listeners.
engine.on('RequestMapInitData', requestMapData);
engine.on('GenerateMap', generateMap);
console.log("Loaded ml_inland_sea.ts");
console.log("hey, ml_inland_sea is firing");
function createLandmasses(iWidth, iHeight, continent1, continent2, iStartSectorRows, iStartSectorCols, startSectors) {
    FractalBuilder.create(globals.g_LandmassFractal, iWidth, iHeight, 2, 0);
    let iWaterHeight = FractalBuilder.getHeightFromPercent(globals.g_LandmassFractal, globals.g_WaterPercent);
    let iBuffer = Math.floor(iHeight / 18.0);
    let iBuffer2 = Math.floor(iWidth / 28.0);

    //先预估一下洞的位置
    let water_holes_1 = new Array();
    let water_holes_2 = new Array();

    let myObj = new Object();
    myObj.kX = 0;
    myObj.kY = 0;

    water_holes_1.push(myObj);
    water_holes_2.push(myObj);
    let hole_min_range = 3;
    let water_hole_num = iHeight*iWidth/500;
    let hole_real_num_1 = 0;
    let hole_real_num_2 = 0;
    for (let try_i=0; try_i < water_hole_num; try_i++) {
        let current_mode = TerrainBuilder.getRandomNumber(4, "Random Holes X");
        let randX1 = continent1.west + TerrainBuilder.getRandomNumber(continent1.east-continent1.west, "Random Holes X");
        let randY1 = continent1.south + TerrainBuilder.getRandomNumber(continent1.north-continent1.south, "Random Holes Y");
        
        let pX1 = continent1.east-1
        let pY1 = continent1.north-1
        if (current_mode==1){
            pX1 = randX1
            pY1 = continent1.south+1
        }
        else if (current_mode==2) {
            pX1 = randX1
            pY1 = continent1.north-1
        }
        else if (current_mode==3) {
            pX1 = continent1.east-1
            pY1 = randY1
        }
        else if (current_mode==4) {
            pX1 = continent1.west+1
            pY1 = randY1
        }

        let isValid_1 = true;
        for (const [index, plot] of water_holes_1.entries()) {         
            if (IsNearPlot_MapleLeavesMap(pX1, pY1, plot.kX, plot.kY, hole_min_range) )  {
                isValid_1 = false; 
                break;  
            }
        }
        if (isValid_1) {
            let myObj = new Object();
            myObj.kX = pX1;
            myObj.kY = pY1;
            water_holes_1.push(myObj);
            hole_real_num_1 = hole_real_num_1 +1;
        }

        let randX2 = continent2.west + TerrainBuilder.getRandomNumber(continent2.east-continent2.west, "Random Holes X");
        let randY2 = continent2.south + TerrainBuilder.getRandomNumber(continent2.north-continent2.south, "Random Holes Y");

        let pX2 = continent2.east-1
        let pY2 = continent2.north-1
        if (current_mode==1){
            pX2 = randX2
            pY2 = continent2.south+1
        }
        else if (current_mode==2) {
            pX2 = randX2
            pY2 = continent2.north-1
        }
        else if (current_mode==3) {
            pX2 = continent2.east-1
            pY2 = randY2
        }
        else if (current_mode==4) {
            pX2 = continent2.west+1
            pY2 = randY2
        }

        let isValid_2 = true
        for (const [index, plot] of water_holes_2.entries()) {         
            if (IsNearPlot_MapleLeavesMap(pX2, pY2, plot.kX, plot.kY, hole_min_range) )  {
                isValid_2 = false;
                break;       
            }
        }
        if (isValid_2) {
            let myObj = new Object();
            myObj.kX = pX2;
            myObj.kY = pY2;
            water_holes_2.push(myObj)
            hole_real_num_2 = hole_real_num_2 + 1;
        }
    }

    console.log("hole_real_num_1=\t", hole_real_num_1);
    console.log("hole_real_num_2=\t", hole_real_num_2);

    // 确定一下内海的长轴和短轴，初步确定为1/8
    let inland_sea_r_a_1 = (continent1.east - continent1.west)/8
    let inland_sea_r_b_1 = (continent1.north - continent1.south)/8

    let inland_sea_r_a_2 = (continent2.east - continent2.west)/8
    let inland_sea_r_b_2 = (continent2.north - continent2.south)/8

    console.log("inland_sea_r_a_1=\t", inland_sea_r_a_1);
    console.log("inland_sea_r_b_1=\t", inland_sea_r_b_1);

    let inland_sea_center_x_1 = (continent1.east + continent1.west)/2 -3 + TerrainBuilder.getRandomNumber(5, "Random InlandSea X");
    let inland_sea_center_y_1 = (continent1.north + continent1.south)/2 -1 + TerrainBuilder.getRandomNumber(3, "Random InlandSea Y");

    console.log("inland_sea_center_x_1=\t", inland_sea_center_x_1);
    console.log("inland_sea_center_y_1=\t", inland_sea_center_y_1);

    let inland_sea_center_x_2 = (continent2.east + continent2.west)/2 -3 + TerrainBuilder.getRandomNumber(5, "Random InlandSea X");
    let inland_sea_center_y_2 = (continent2.north + continent2.south)/2 -1 + TerrainBuilder.getRandomNumber(3, "Random InlandSea Y");

    let continent1_mode = TerrainBuilder.getRandomNumber(4, "Random Inland Sea Opening");
    let continent2_mode = TerrainBuilder.getRandomNumber(2, "Random Inland Sea Opening 2");
    if (continent1_mode == 1 || continent1_mode == 2){
        if (continent2_mode == 1 ){
            continent2_mode == 1;
        }
        else{
            continent2_mode == 2;
        }
    }
    else{
        if (continent2_mode == 1 ){
            continent2_mode == 3;
        }
        else{
            continent2_mode == 4;
        }
    }

    let inland_sea_opening = 1.5;

    for (let iY = 0; iY < iHeight; iY++) {
        for (let iX = 0; iX < iWidth; iX++) {
            let terrain = globals.g_FlatTerrain;
            let iRandom = TerrainBuilder.getRandomNumber(iBuffer, "Random Top/Bottom Edges");
            let iRandom2 = TerrainBuilder.getRandomNumber(iBuffer2, "Random Left/Right Edges");
            // Initialize plot tag
            TerrainBuilder.setPlotTag(iX, iY, PlotTags.PLOT_TAG_NONE);
            //  Must be water if at the poles
            if (iY < continent1.south + iRandom || iY >= continent1.north - iRandom) {
                terrain = globals.g_OceanTerrain;
            }
            // Of if between the continents
            else if (iX < continent1.west + iRandom2 || iX >= continent2.east - iRandom2 ||
                (iX >= continent1.east - iRandom2 && iX < continent2.west + iRandom2)) {
                terrain = globals.g_OceanTerrain;
            }
            
             // Add some ocean/coast to break the rectangular borders
            // 第一步，先截掉4个角。
            if (((iY - continent1.south-1)**2+(iX - continent1.east+1)**2<9) || 
                ((iY - continent1.north+1)**2+(iX - continent1.east+1)**2<9) ||
                ((iY - continent1.north+1)**2+(iX - continent1.west-1)**2<9) ||
                ((iY - continent1.south-1)**2+(iX - continent1.west-1)**2<9)
                
                ) {
                terrain = globals.g_OceanTerrain;
            }

            if (((iY - continent2.south-1)**2+(iX - continent2.east+1)**2<9) || 
                ((iY - continent2.north+1)**2+(iX - continent2.east+1)**2<9) ||
                ((iY - continent2.north+1)**2+(iX - continent2.west-1)**2<9) ||
                ((iY - continent2.south-1)**2+(iX - continent2.west-1)**2<9)
                
                ) {
                terrain = globals.g_OceanTerrain;
            }

            //第二步，在边界上画若干个圆，圆的半径为2-4，圆心距离至少为3。
            let current_radius_1 = 1+TerrainBuilder.getRandomNumber(3, "Random Hole Radius 1");
            for (const [index, plot] of water_holes_1.entries()) {         
                if (IsNearPlot_MapleLeavesMap(iX, iY, plot.kX, plot.kY, current_radius_1) )  {
                    terrain = globals.g_OceanTerrain;
                    break;   
                }
            }
            
            let current_radius_2 = 1+TerrainBuilder.getRandomNumber(3, "Random Hole Radius 2");
            for (const [index, plot] of water_holes_2.entries()) {         
                if (IsNearPlot_MapleLeavesMap(iX, iY, plot.kX, plot.kY, current_radius_2) )  {
                    terrain = globals.g_OceanTerrain;
                    break;   
                }
            }

            // 第三步，画出一个内海 
            if (IsNearPlot_Elliptical_MapleLeavesMap(iX, iY, inland_sea_center_x_1, inland_sea_center_y_1, inland_sea_r_a_1, inland_sea_r_b_1)) {
                terrain = globals.g_OceanTerrain;
            }
            else if (IsNearPlot_Elliptical_MapleLeavesMap(iX, iY, inland_sea_center_x_1, inland_sea_center_y_1, inland_sea_r_a_1+2, inland_sea_r_b_1+1)) {
                // 概率扩展
                let expand_rand = TerrainBuilder.getRandomNumber(10, "Random Inland Sea Expand");
                if (expand_rand <= 2) {
                    terrain = globals.g_OceanTerrain;
                }
            }

            if (IsNearPlot_Elliptical_MapleLeavesMap(iX, iY, inland_sea_center_x_2, inland_sea_center_y_2, inland_sea_r_a_2, inland_sea_r_b_2)) {
                terrain = globals.g_OceanTerrain;
            }
            else if (IsNearPlot_Elliptical_MapleLeavesMap(iX, iY, inland_sea_center_x_2, inland_sea_center_y_2, inland_sea_r_a_2+2, inland_sea_r_b_2+1)) {
                // 概率扩展
                let expand_rand = TerrainBuilder.getRandomNumber(10, "Random Inland Sea Expand");
                if (expand_rand <= 2) {
                    terrain = globals.g_OceanTerrain;
                }
            }
            
            // 第四步，对内海做一个豁口。固定豁口在45度处，四种情况，先抽大陆1的，决定之后再在两种情况抽大陆2的。
            
            // 1-4对应4个象限
            let distance_continent_1_v1 = Math.abs((iY-inland_sea_center_y_1 - (iX-inland_sea_center_x_1) )/Math.sqrt(2))
            let distance_continent_1_v2 = Math.abs((iY-inland_sea_center_y_1 + (iX-inland_sea_center_x_1) )/Math.sqrt(2))
            if (continent1_mode == 1 ) {
                if (distance_continent_1_v1 < inland_sea_opening && iX > inland_sea_center_x_1 && iX < continent1.east){
                    terrain = globals.g_OceanTerrain;
                }
            }
            else if (continent1_mode == 2 ) {
                if (distance_continent_1_v2 < inland_sea_opening && iX > inland_sea_center_x_1 && iX < continent1.east){
                    terrain = globals.g_OceanTerrain;
                }
            }
            else if (continent1_mode == 3 ) {
                if (distance_continent_1_v1 < inland_sea_opening && iX < inland_sea_center_x_1 && iX > continent1.west){
                    terrain = globals.g_OceanTerrain;
                }
            }
            else if (continent1_mode == 4 ) {
                if (distance_continent_1_v2 < inland_sea_opening && iX < inland_sea_center_x_1 && iX > continent1.west){
                    terrain = globals.g_OceanTerrain;
                }
            }

            let distance_continent_2_v1 = Math.abs((iY-inland_sea_center_y_2 - (iX-inland_sea_center_x_2) )/Math.sqrt(2))
            let distance_continent_2_v2 = Math.abs((iY-inland_sea_center_y_2 + (iX-inland_sea_center_x_2) )/Math.sqrt(2))
            if (continent1_mode == 1 ) {
                if (distance_continent_2_v1 < inland_sea_opening && iX > inland_sea_center_x_2 && iX < continent2.east){
                    terrain = globals.g_OceanTerrain;
                }
            }
            else if (continent1_mode == 2 ) {
                if (distance_continent_2_v2 < inland_sea_opening && iX > inland_sea_center_x_2 && iX < continent2.east){
                    terrain = globals.g_OceanTerrain;
                }
            }
            else if (continent1_mode == 3 ) {
                if (distance_continent_2_v1 < inland_sea_opening && iX < inland_sea_center_x_2 && iX > continent2.west){
                    terrain = globals.g_OceanTerrain;
                }
            }
            else if (continent1_mode == 4 ) {
                if (distance_continent_2_v2 < inland_sea_opening && iX < inland_sea_center_x_2 && iX > continent2.west){
                    terrain = globals.g_OceanTerrain;
                }
            }


            // 第五步，回到原版的处理浅海

            if ( (iX >= continent1.west + iRandom2 && iX < continent1.east - iRandom2 && iY < continent1.north - iRandom && iY >= continent1.south + iRandom) ||
                 (iX >= continent2.west + iRandom2 && iX < continent2.east - iRandom2 && iY < continent2.north - iRandom && iY >= continent2.south + iRandom)
                ) {
                let iPlotHeight = utilities.getHeightAdjustingForStartSector(iX, iY, iWaterHeight, globals.g_FractalWeight, globals.g_CenterWeight, globals.g_StartSectorWeight, continent1, continent2, iStartSectorRows, iStartSectorCols, startSectors);
                // Finally see whether or not this stays as Land or has too low a score and drops back to water
                if (iPlotHeight < iWaterHeight * globals.g_Cutoff) {
                    let iSector = utilities.getSector(iX, iY, iStartSectorRows, iStartSectorCols, continent1.south, continent1.north, continent1.west, continent1.east, continent2.west);
                    if (startSectors[iSector]) {
                        terrain = globals.g_CoastTerrain;
                    }
                    else {
                        terrain = globals.g_OceanTerrain;
                    }
                }
            }        

            // Add plot tag if applicable
            if (terrain != globals.g_OceanTerrain && terrain != globals.g_CoastTerrain) {
                utilities.addLandmassPlotTags(iX, iY, continent2.west);
            }
            else {
                utilities.addWaterPlotTags(iX, iY, continent2.west);
            }
            TerrainBuilder.setTerrainType(iX, iY, terrain);
        }
    }
}

function IsNearPlot_MapleLeavesMap(iX, iY, kX, kY, radius) {

    if ((iX-kX)**2+(iY-kY)**2<radius){
        return true
    }
    else {
        return false   
    }
}

function IsNearPlot_Elliptical_MapleLeavesMap(iX, iY, kX, kY, r_a, r_b) {

    if ((iX-kX)**2/(r_a*r_a)+(iY-kY)**2/(r_b*r_b)<1){
        return true
    }
    else {
        return false   
    }
}


//# sourceMappingURL=file:///base-standard/maps/continents.js.map
