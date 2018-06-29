import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base.js";

/**Global state of the app

*- Search object
*- Current recipe object
*- Shopping list object
*- Liked recipes
*/
const state = {};

/*
*Search Controller
*/
const controlSearch = async () =>{
    // 1) get the query from the view
    const query = searchView.getInput();
    
    
    if(query){
        //2) new search object and add it to state
        state.search = new Search(query);
        
        //3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        
        try {
            //4) Search for recipes
            await state.search.getResults(); //returns a promise
            
            //5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch(err){
            alert("Something went wrong.  Try again");
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener("submit", e =>{
    e.preventDefault();
    controlSearch();
});



elements.searchResPages.addEventListener("click", e =>{
    const btn = e.target.closest(".btn-inline");
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/*
*Recipe Controller
*/
const controlRecipe = async () =>{
    //Get ID from URL
    const id = window.location.hash.replace("#", "");
    
    if(id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        
        // Highlight selected search item
        
        if (state.search) searchView.highlightSelected(id);
        
        //Create new recipe object
        state.recipe = new Recipe(id);
        
        
        try{
        
            //Get Recipe from DATA and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            
            //Calculate Servings and Time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //Render Recipe
            
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id) );
            
            
        } catch(error){
            console.log(error);
            alert("Error processing Recipe");
        }
    }
};

 ["hashchange", "load"].forEach(event => window.addEventListener(event, controlRecipe));

/*
***List Controller
*/
const controlList= () => {
    // 1) Create a new list if there is none yet
    if(!state.list) state.list = new List();
    
    // 2) Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};


//Handle delete and update list item events

elements.shopping.addEventListener("click", e =>{
    const id = e.target.closest(".shopping__item").dataset.itemid;
    
    //Handle the delete button
    
    if(e.target.matches(".shopping__delete, .shopping__delete *")){
        //delete item from state
        state.list.deleteItem(id);
        
        //Delete from UI
        listView.deleteItem(id);
        //Handle the count update
    } else if(e.target.matches(".shopping__count-value")){
        const val = parseFloat(e.target.value);
        state.list.updateCount(id, val);
    }
});


/**
LIKES CONTROLLER
**/


const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    
    
    //User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)){
        //Add like to the state
        const newLike = state.likes.addLike(
        currentID,
        state.recipe.title,
        state.recipe.author,
        state.recipe.img 
        );
        //Toggle the like button
        likesView.toggleLikeBtn(true);
        
        //Add like to the UI list
        likesView.renderLike(newLike);

    //User HAS liked recipe
    } else {
        //Remove like from the state
        state.likes.deleteLike(currentID)
        
        //Toggle the like button
        likesView.toggleLikeBtn(false);
        
        //Remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};


//Restore liked recipes on pageLoad

window.addEventListener("load", ()=>{
    state.likes = new Likes();
    //Restore Likes
    state.likes.readStorage();
    
    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    
    //Render existing likes
    state.likes.likes.forEach(like=> likesView.renderLike(like));

});



//Handling Recipe button clicks 
elements.recipe.addEventListener("click", e =>{
    if (e.target.matches(".btn-decrease, .btn-decrease *")){
    
    //decrease button is clicked
    if(state.recipe.servings > 1){
        state.recipe.updateServings("dec");
        recipeView.updateServingsIngredients(state.recipe);
        }

    } else if (e.target.matches(".btn-increase, .btn-increase *")){
    
        //Increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);

    } else if(e.target.matches(".recipe__btn--add, .recipe__btn--add *")){
       //Add ingredients to shoping list
        controlList();
    } else if (e.target.matches(".recipe__love, .recipe__love *")){
        controlLike();
    }
});