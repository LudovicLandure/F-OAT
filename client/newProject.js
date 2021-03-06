import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import {Projects} from '../lib/collections/Project.js';
import './newProject.html';

Template.newproject.onCreated(function(){
  Session.set('postSubmitErrors',{});
});

Template.newproject.helpers({
  errorMessage: function(field){
    return Session.get('postSubmitErrors')[field];
  },
  errorClass: function(field){
    return !!Session.get('postSubmitErrors')[field] ? 'has-error' : '';
  }
});

Template.newproject.events({

  'click #newProjectForm' (event,instance){
    event.preventDefault();
    var _projectName = $('.projectName').val();
    var _projectUrl = $('.url').val();

    var _projectFile = $('#selectedFile')[0].files[0];

    var _url = 'error';

    //If we give an URL for the project
    if(!_projectFile){
      _url = _projectUrl;
    }

    //Else, if we give a file for the project
    else if(!_projectUrl){
      _url = _projectFile.name;
      ext = ['mp4','avi','mkv','wmv','mov'];
      if(!checkExtension(ext,_url)){
        _url = 'errorExt';
      }
    }

    var ownerId = Meteor.user();
    var project = {
      name: _projectName,
      owner: ownerId.username,
      url: _url
    };

    //We verify the name and the url of the project (not null and not already used)

    var errors = validateProject(project);
    if(errors.name || errors.url || errors.file){
      return Session.set('postSubmitErrors',errors);
    }

    Projects.insert(project,(err)=>{
      if(err){
        alert("error insert");
      }else{
        if(_projectFile){
          //Get the data of the file
          reader = new FileReader();

          //When reading file is done
          reader.onload = function(event){

            var buffer =  new Uint8Array(reader.result) //convert to binary

            //Call a method from project.js on server side
            Meteor.call('createFile', {project,buffer}, function(error, result){
              if(error){
                alert(error.reason);
              }
              else{
                alert("Your file will be uploaded. Uploading will take minutes to hours. You will be notified when the upload is done.")
                Router.go("/");
              }
            });
          }

          reader.readAsArrayBuffer(_projectFile); //read the file as arraybuffer

        }
        else{
          Router.go("/");
        }
      }
    });
  }

});


// This function is used to check that the file is a video
function checkExtension(verifExt, fileValue){
  var fileExtension = fileValue.substring(fileValue.lastIndexOf(".")+1, fileValue.lenght);
  fileExtension = fileExtension.toLowerCase();
  for (var ext of verifExt){
    if(fileExtension==ext){
      return true;
    }
  }
  return false;
}
